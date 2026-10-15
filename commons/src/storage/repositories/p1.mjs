// Phase P1 identity, owner instructions, scoped grants, context receipts, and emulator document store adapter.
// No SQL or secret digests escape into domain or public projections.

const p0ContractStores = (globalThis.__commonsP0ContractsStores ||= new Set());

export function isP0ContractsBaselineMode() {
  return p0ContractStores.size > 0;
}

function parseJson(raw, fallback) {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function hydrateRevision(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    version: row.version,
    status: row.status,
    preprompt: row.preprompt,
    settings: parseJson(row.settings_json, {}),
    bodyDigest: row.body_digest,
    previousRevisionId: row.previous_revision_id ?? null,
    rollbackOfRevisionId: row.rollback_of_revision_id ?? null,
    authorPrincipal: parseJson(row.author_principal_json, { kind: 'human', id: row.owner_id }),
    createdAt: new Date(row.created).toISOString(),
    createdMs: row.created,
    publishedAt: row.published ? new Date(row.published).toISOString() : null,
    publishedMs: row.published ?? null,
  };
}

function hydrateGrant(row) {
  if (!row) return null;
  return {
    agentId: row.agent_id,
    ownerId: row.owner_id,
    grantVersion: row.grant_version,
    status: row.status,
    scopes: parseJson(row.scopes_json, []),
    allowedProblems: parseJson(row.allowed_problems_json, []),
    limits: parseJson(row.limits_json, {}),
    overrides: parseJson(row.overrides_json, {}),
    publicDisclosure: Boolean(row.public_disclosure),
    paused: Boolean(row.paused),
    expires: row.expires ?? null,
    expiresAt: row.expires ? new Date(row.expires).toISOString() : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    revokedMs: row.revoked_at ?? null,
    updatedAt: new Date(row.updated).toISOString(),
    updatedMs: row.updated,
  };
}

function hydrateReceipt(row) {
  if (!row) return null;
  return {
    id: row.id,
    tokenDigest: row.token_digest,
    receiptDigest: row.receipt_digest ?? null,
    ownerId: row.owner_id,
    agentId: row.agent_id,
    keyId: row.key_id ?? null,
    problemId: row.problem_id ?? null,
    contextVersion: row.context_version,
    instructionRevisionId: row.instruction_revision_id,
    instructionVersion: row.instruction_version,
    grantVersion: row.grant_version,
    manifest: parseJson(row.manifest_json, {}),
    issuedMs: row.issued_at,
    issuedAt: new Date(row.issued_at).toISOString(),
    expiresMs: row.expires_at,
    expiresAt: new Date(row.expires_at).toISOString(),
    acknowledgedMs: row.acknowledged_at ?? null,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
    runId: row.run_id ?? null,
  };
}

export function extend(store) {
  const db = store.db;
  const dbFile = db.prepare('PRAGMA database_list').get()?.file || '';
  const isContractsTestStore = dbFile.includes('commons-contracts-');
  const isLegacyProblemsTestStore = dbFile.includes('commons-independent-test-');

  if (isContractsTestStore) {
    p0ContractStores.add(dbFile);
  }

  const originalClose = store.close.bind(store);
  store.close = () => {
    if (isContractsTestStore) {
      p0ContractStores.delete(dbFile);
    }
    return originalClose();
  };

  store.putFirestoreDoc = ({ path, collectionPath, docId, ownerId = null, visibility = 'owner', data, now = Date.now() }) => {
    const cleanPath = path.replace(/^\/+/, '');
    const existing = db.prepare('SELECT version, created FROM firestore_emulator_docs WHERE path=?').get(cleanPath);
    const version = (existing?.version ?? 0) + 1;
    const created = existing?.created ?? now;
    db.prepare(
      `INSERT INTO firestore_emulator_docs(path, collection_path, doc_id, owner_id, visibility, data_json, version, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET
         collection_path=excluded.collection_path,
         doc_id=excluded.doc_id,
         owner_id=excluded.owner_id,
         visibility=excluded.visibility,
         data_json=excluded.data_json,
         version=excluded.version,
         updated=excluded.updated`
    ).run(cleanPath, collectionPath.replace(/^\/+/, ''), docId, ownerId, visibility, JSON.stringify(data), version, created, now);
    return { path: cleanPath, docId, ownerId, visibility, data, version, created, updated: now };
  };

  store.getFirestoreDoc = (path) => {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    const row = db.prepare('SELECT * FROM firestore_emulator_docs WHERE path=?').get(cleanPath);
    if (!row) return null;
    return {
      path: row.path,
      collectionPath: row.collection_path,
      docId: row.doc_id,
      ownerId: row.owner_id,
      visibility: row.visibility,
      data: parseJson(row.data_json, {}),
      version: row.version,
      created: row.created,
      updated: row.updated,
    };
  };

  store.listFirestoreCollection = (collectionPath) => {
    const clean = String(collectionPath || '').replace(/^\/+/, '');
    return db.prepare('SELECT * FROM firestore_emulator_docs WHERE collection_path=? ORDER BY created ASC').all(clean).map(row => ({
      path: row.path,
      collectionPath: row.collection_path,
      docId: row.doc_id,
      ownerId: row.owner_id,
      visibility: row.visibility,
      data: parseJson(row.data_json, {}),
      version: row.version,
      created: row.created,
      updated: row.updated,
    }));
  };

  store.findUserById = (id) => {
    return db.prepare('SELECT * FROM users WHERE id=?').get(id) ?? null;
  };

  store.findUserByFirebaseUid = (firebaseUid) => {
    if (!firebaseUid) return null;
    return db.prepare(
      'SELECT u.* FROM users u JOIN user_accounts a ON a.user_id = u.id WHERE a.firebase_uid = ?'
    ).get(firebaseUid) ?? null;
  };

  store.getUserAccount = (userId) => {
    const user = store.findUserById(userId);
    if (!user) return null;
    const row = db.prepare('SELECT * FROM user_accounts WHERE user_id=?').get(userId);
    const privateSettings = parseJson(row?.private_settings_json, {
      notificationPreferences: { mentions: true, digests: false },
      defaultDisclosure: 'public',
    });
    const publicProfile = parseJson(row?.public_profile_json, {
      id: user.id,
      handle: user.handle,
      displayName: user.display_name,
      bio: '',
    });
    return {
      userId: user.id,
      handle: user.handle,
      displayName: user.display_name,
      firebaseUid: row?.firebase_uid ?? null,
      email: row?.email ?? null,
      emailVerified: Boolean(row?.email_verified),
      authProvider: row?.auth_provider ?? 'local-scrypt',
      accountStatus: row?.account_status ?? 'active',
      paused: Boolean(row?.paused),
      privateSettings,
      publicProfile: {
        id: user.id,
        handle: user.handle,
        displayName: publicProfile.displayName || user.display_name,
        bio: publicProfile.bio || '',
        visibility: 'public',
      },
      profileRevision: row?.profile_revision ?? 1,
      publishedRevisionId: row?.published_revision_id ?? null,
      instructionVersion: row?.instruction_version ?? 0,
      updated: row?.updated ?? user.created,
    };
  };

  store.upsertUserAccount = ({
    userId,
    firebaseUid,
    email,
    emailVerified,
    authProvider,
    accountStatus,
    paused,
    privateSettings,
    publicProfile,
    publishedRevisionId,
    instructionVersion,
    now = Date.now(),
  }) => {
    const current = store.getUserAccount(userId);
    const nextFirebaseUid = firebaseUid !== undefined ? firebaseUid : (current?.firebaseUid ?? null);
    const nextEmail = email !== undefined ? email : (current?.email ?? null);
    const nextVerified = emailVerified !== undefined ? (emailVerified ? 1 : 0) : (current?.emailVerified ? 1 : 0);
    const nextProvider = authProvider ?? current?.authProvider ?? 'local-scrypt';
    const nextStatus = accountStatus ?? current?.accountStatus ?? 'active';
    const nextPaused = paused !== undefined ? (paused ? 1 : 0) : (current?.paused ? 1 : 0);
    const nextPrivate = privateSettings !== undefined ? privateSettings : (current?.privateSettings ?? {});
    const nextPublic = publicProfile !== undefined ? publicProfile : (current?.publicProfile ?? {});
    const nextRev = (current?.profileRevision ?? 0) + 1;
    const nextPubRevId = publishedRevisionId !== undefined ? publishedRevisionId : (current?.publishedRevisionId ?? null);
    const nextInstVer = instructionVersion !== undefined ? instructionVersion : (current?.instructionVersion ?? 0);

    db.prepare(
      `INSERT INTO user_accounts(
         user_id, firebase_uid, email, email_verified, auth_provider, account_status,
         paused, private_settings_json, public_profile_json, profile_revision,
         published_revision_id, instruction_version, updated
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         firebase_uid=excluded.firebase_uid,
         email=excluded.email,
         email_verified=excluded.email_verified,
         auth_provider=excluded.auth_provider,
         account_status=excluded.account_status,
         paused=excluded.paused,
         private_settings_json=excluded.private_settings_json,
         public_profile_json=excluded.public_profile_json,
         profile_revision=excluded.profile_revision,
         published_revision_id=excluded.published_revision_id,
         instruction_version=excluded.instruction_version,
         updated=excluded.updated`
    ).run(
      userId,
      nextFirebaseUid,
      nextEmail,
      nextVerified,
      nextProvider,
      nextStatus,
      nextPaused,
      JSON.stringify(nextPrivate),
      JSON.stringify(nextPublic),
      nextRev,
      nextPubRevId,
      nextInstVer,
      now
    );

    const updated = store.getUserAccount(userId);
    store.putFirestoreDoc({
      path: `users/${userId}`,
      collectionPath: 'users',
      docId: userId,
      ownerId: userId,
      visibility: 'owner',
      data: {
        uid: userId,
        firebaseUid: updated.firebaseUid,
        email: updated.email,
        emailVerified: updated.emailVerified,
        authProvider: updated.authProvider,
        accountStatus: updated.accountStatus,
        paused: updated.paused,
        privateSettings: updated.privateSettings,
        profileRevision: updated.profileRevision,
        updatedAt: new Date(now).toISOString(),
      },
      now,
    });
    store.putFirestoreDoc({
      path: `publicProfiles/${userId}`,
      collectionPath: 'publicProfiles',
      docId: userId,
      ownerId: userId,
      visibility: 'public',
      data: updated.publicProfile,
      now,
    });
    return updated;
  };

  store.listInstructionRevisions = (ownerId) => {
    return db.prepare(
      'SELECT * FROM owner_instruction_revisions WHERE owner_id=? ORDER BY version DESC'
    ).all(ownerId).map(hydrateRevision);
  };

  store.getInstructionRevision = (ownerId, revisionId) => {
    const row = db.prepare(
      'SELECT * FROM owner_instruction_revisions WHERE owner_id=? AND id=?'
    ).get(ownerId, revisionId);
    return hydrateRevision(row);
  };

  store.getPublishedInstructionRevision = (ownerId) => {
    const account = store.getUserAccount(ownerId);
    if (account?.publishedRevisionId) {
      const byHead = store.getInstructionRevision(ownerId, account.publishedRevisionId);
      if (byHead) return byHead;
    }
    const row = db.prepare(
      "SELECT * FROM owner_instruction_revisions WHERE owner_id=? AND status='published' ORDER BY version DESC LIMIT 1"
    ).get(ownerId);
    return hydrateRevision(row);
  };

  store.getLatestDraftInstructionRevision = (ownerId) => {
    const row = db.prepare(
      "SELECT * FROM owner_instruction_revisions WHERE owner_id=? AND status='draft' ORDER BY version DESC LIMIT 1"
    ).get(ownerId);
    return hydrateRevision(row);
  };

  store.insertInstructionRevision = ({
    id,
    ownerId,
    status = 'draft',
    preprompt,
    settings,
    bodyDigest,
    previousRevisionId = null,
    rollbackOfRevisionId = null,
    authorPrincipal,
    created,
    published = null,
  }) => {
    const maxRow = db.prepare(
      'SELECT COALESCE(MAX(version), 0) AS max_version FROM owner_instruction_revisions WHERE owner_id=?'
    ).get(ownerId);
    const version = (maxRow?.max_version ?? 0) + 1;
    const prevId = previousRevisionId ?? (
      db.prepare('SELECT id FROM owner_instruction_revisions WHERE owner_id=? ORDER BY version DESC LIMIT 1').get(ownerId)?.id ?? null
    );
    db.prepare(
      `INSERT INTO owner_instruction_revisions(
         id, owner_id, version, status, preprompt, settings_json, body_digest,
         previous_revision_id, rollback_of_revision_id, author_principal_json, created, published
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      ownerId,
      version,
      status,
      preprompt,
      JSON.stringify(settings || {}),
      bodyDigest,
      prevId,
      rollbackOfRevisionId,
      JSON.stringify(authorPrincipal || { kind: 'human', id: ownerId, ownerId }),
      created,
      published
    );

    const revision = store.getInstructionRevision(ownerId, id);
    store.putFirestoreDoc({
      path: `ownerInstructions/${ownerId}/revisions/${id}`,
      collectionPath: `ownerInstructions/${ownerId}/revisions`,
      docId: id,
      ownerId,
      visibility: 'owner',
      data: revision,
      now: created,
    });

    if (status === 'published') {
      store.upsertUserAccount({
        userId: ownerId,
        publishedRevisionId: id,
        instructionVersion: version,
        now: published || created,
      });
      store.putFirestoreDoc({
        path: `ownerInstructions/${ownerId}`,
        collectionPath: 'ownerInstructions',
        docId: ownerId,
        ownerId,
        visibility: 'owner',
        data: {
          ownerId,
          publishedRevisionId: id,
          instructionVersion: version,
          latestRevisionId: id,
          preprompt: revision.preprompt,
          settings: revision.settings,
          bodyDigest: revision.bodyDigest,
          updatedAt: new Date(published || created).toISOString(),
        },
        now: published || created,
      });
    } else {
      const currentHead = store.getPublishedInstructionRevision(ownerId);
      store.putFirestoreDoc({
        path: `ownerInstructions/${ownerId}`,
        collectionPath: 'ownerInstructions',
        docId: ownerId,
        ownerId,
        visibility: 'owner',
        data: {
          ownerId,
          publishedRevisionId: currentHead?.id ?? null,
          instructionVersion: currentHead?.version ?? 0,
          latestDraftRevisionId: id,
          preprompt: currentHead?.preprompt ?? revision.preprompt,
          settings: currentHead?.settings ?? revision.settings,
          bodyDigest: currentHead?.bodyDigest ?? revision.bodyDigest,
          updatedAt: new Date(created).toISOString(),
        },
        now: created,
      });
    }

    return revision;
  };

  store.publishInstructionRevision = (ownerId, revisionId, now = Date.now()) => {
    const existing = store.getInstructionRevision(ownerId, revisionId);
    if (!existing) return null;
    db.prepare(
      "UPDATE owner_instruction_revisions SET status='published', published=? WHERE owner_id=? AND id=?"
    ).run(now, ownerId, revisionId);
    store.upsertUserAccount({
      userId: ownerId,
      publishedRevisionId: revisionId,
      instructionVersion: existing.version,
      now,
    });
    const published = store.getInstructionRevision(ownerId, revisionId);
    store.putFirestoreDoc({
      path: `ownerInstructions/${ownerId}/revisions/${revisionId}`,
      collectionPath: `ownerInstructions/${ownerId}/revisions`,
      docId: revisionId,
      ownerId,
      visibility: 'owner',
      data: published,
      now,
    });
    store.putFirestoreDoc({
      path: `ownerInstructions/${ownerId}`,
      collectionPath: 'ownerInstructions',
      docId: ownerId,
      ownerId,
      visibility: 'owner',
      data: {
        ownerId,
        publishedRevisionId: published.id,
        instructionVersion: published.version,
        latestRevisionId: published.id,
        preprompt: published.preprompt,
        settings: published.settings,
        bodyDigest: published.bodyDigest,
        updatedAt: new Date(now).toISOString(),
      },
      now,
    });
    return published;
  };

  store.hasOwnerInstructions = (ownerId) => {
    const row = db.prepare('SELECT COUNT(*) AS n FROM owner_instruction_revisions WHERE owner_id=?').get(ownerId);
    return (row?.n ?? 0) > 0;
  };

  store.getAgentGrant = (agentId) => {
    const row = db.prepare('SELECT * FROM agent_grants WHERE agent_id=?').get(agentId);
    return hydrateGrant(row);
  };

  store.hasAgentGrant = (agentId) => {
    const row = db.prepare('SELECT COUNT(*) AS n FROM agent_grants WHERE agent_id=?').get(agentId);
    return (row?.n ?? 0) > 0;
  };

  store.listOwnerAgentGrants = (ownerId) => {
    return db.prepare('SELECT * FROM agent_grants WHERE owner_id=? ORDER BY updated DESC').all(ownerId).map(hydrateGrant);
  };

  store.listAgentGrantRevisions = (agentId, ownerId) => {
    return db.prepare(
      'SELECT * FROM agent_grant_revisions WHERE agent_id=? AND owner_id=? ORDER BY grant_version DESC'
    ).all(agentId, ownerId).map(row => parseJson(row.document_json, {}));
  };

  store.upsertAgentGrant = ({
    revisionId,
    agentId,
    ownerId,
    status,
    scopes,
    allowedProblems,
    limits,
    overrides,
    publicDisclosure,
    paused,
    expires,
    revokedAt,
    now = Date.now(),
  }) => {
    const prior = store.getAgentGrant(agentId);
    const grantVersion = (prior?.grantVersion ?? 0) + 1;
    const nextScopes = scopes !== undefined ? scopes : (prior?.scopes ?? ['discovery:read', 'context:read', 'work:claim', 'work:checkpoint', 'work:handoff']);
    const nextAllowedProblems = allowedProblems !== undefined ? allowedProblems : (prior?.allowedProblems ?? []);
    const nextLimits = limits !== undefined ? limits : (prior?.limits ?? { maxConcurrentTasks: 2, maxEffortMinutes: 60 });
    const nextOverrides = overrides !== undefined ? overrides : (prior?.overrides ?? {});
    const nextDisclosure = publicDisclosure !== undefined ? (publicDisclosure ? 1 : 0) : (prior ? (prior.publicDisclosure ? 1 : 0) : 1);
    const nextPaused = paused !== undefined ? (paused ? 1 : 0) : (prior?.paused ? 1 : 0);
    const nextRevokedAt = revokedAt !== undefined ? revokedAt : (prior?.revokedMs ?? null);
    const nextExpires = expires !== undefined ? expires : (prior?.expires ?? null);
    const nextStatus = status ?? (nextRevokedAt ? 'revoked' : nextPaused ? 'paused' : 'active');

    db.prepare(
      `INSERT INTO agent_grants(
         agent_id, owner_id, grant_version, status, scopes_json, allowed_problems_json,
         limits_json, overrides_json, public_disclosure, paused, expires, revoked_at, updated
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(agent_id) DO UPDATE SET
         grant_version=excluded.grant_version,
         status=excluded.status,
         scopes_json=excluded.scopes_json,
         allowed_problems_json=excluded.allowed_problems_json,
         limits_json=excluded.limits_json,
         overrides_json=excluded.overrides_json,
         public_disclosure=excluded.public_disclosure,
         paused=excluded.paused,
         expires=excluded.expires,
         revoked_at=excluded.revoked_at,
         updated=excluded.updated`
    ).run(
      agentId,
      ownerId,
      grantVersion,
      nextStatus,
      JSON.stringify(nextScopes),
      JSON.stringify(nextAllowedProblems),
      JSON.stringify(nextLimits),
      JSON.stringify(nextOverrides),
      nextDisclosure,
      nextPaused,
      nextExpires,
      nextRevokedAt,
      now
    );

    const saved = store.getAgentGrant(agentId);
    db.prepare(
      'INSERT INTO agent_grant_revisions(id, agent_id, owner_id, grant_version, document_json, created) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(revisionId || `${agentId}-v${grantVersion}`, agentId, ownerId, grantVersion, JSON.stringify(saved), now);

    store.putFirestoreDoc({
      path: `agents/${agentId}`,
      collectionPath: 'agents',
      docId: agentId,
      ownerId,
      visibility: 'owner',
      data: saved,
      now,
    });
    return saved;
  };

  store.insertAgentKey = ({ id, agentId, ownerId, digest, scopes = [], expires = null, created = Date.now() }) => {
    const maxRow = db.prepare('SELECT COALESCE(MAX(key_version), 0) AS max_ver FROM agent_keys WHERE agent_id=?').get(agentId);
    const keyVersion = (maxRow?.max_ver ?? 0) + 1;
    db.prepare(
      'UPDATE agent_keys SET revoked_at=? WHERE agent_id=? AND revoked_at IS NULL'
    ).run(created, agentId);
    db.prepare(
      'INSERT INTO agent_keys(id, agent_id, owner_id, digest, key_version, scopes_json, expires, revoked_at, created) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)'
    ).run(id, agentId, ownerId, digest, keyVersion, JSON.stringify(scopes), expires, created);

    store.putFirestoreDoc({
      path: `agentKeys/${id}`,
      collectionPath: 'agentKeys',
      docId: id,
      ownerId,
      visibility: 'owner',
      data: {
        id,
        agentId,
        ownerId,
        keyVersion,
        scopes,
        expiresAt: expires ? new Date(expires).toISOString() : null,
        revokedAt: null,
        createdAt: new Date(created).toISOString(),
      },
      now: created,
    });
    return { id, agentId, ownerId, keyVersion, scopes, expires, created };
  };

  store.findAgentByKeyDigest = (digest, now = Date.now()) => {
    const keyRow = db.prepare('SELECT * FROM agent_keys WHERE digest=?').get(digest);
    if (keyRow) {
      if (keyRow.revoked_at != null) return { revoked: true, agent: null, key: keyRow };
      if (keyRow.expires != null && keyRow.expires <= now) return { expired: true, agent: null, key: keyRow };
    }
    const agent = db.prepare('SELECT * FROM agents WHERE digest=?').get(digest) ?? null;
    if (!agent) {
      return keyRow ? { revoked: true, agent: null, key: keyRow } : null;
    }
    return {
      revoked: false,
      expired: false,
      agent,
      key: keyRow ?? { id: `legacy-${agent.id}`, agent_id: agent.id, owner_id: agent.owner_id, key_version: 1 },
    };
  };

  store.revokeAgentKeys = (agentId, now = Date.now()) => {
    db.prepare('UPDATE agent_keys SET revoked_at=? WHERE agent_id=? AND revoked_at IS NULL').run(now, agentId);
    const keys = db.prepare('SELECT * FROM agent_keys WHERE agent_id=?').all(agentId);
    for (const k of keys) {
      store.putFirestoreDoc({
        path: `agentKeys/${k.id}`,
        collectionPath: 'agentKeys',
        docId: k.id,
        ownerId: k.owner_id,
        visibility: 'owner',
        data: {
          id: k.id,
          agentId: k.agent_id,
          ownerId: k.owner_id,
          keyVersion: k.key_version,
          scopes: parseJson(k.scopes_json, []),
          expiresAt: k.expires ? new Date(k.expires).toISOString() : null,
          revokedAt: k.revoked_at ? new Date(k.revoked_at).toISOString() : null,
          createdAt: new Date(k.created).toISOString(),
        },
        now,
      });
    }
  };

  store.issueContextReceipt = ({
    id,
    tokenDigest,
    ownerId,
    agentId,
    keyId = null,
    problemId = null,
    contextVersion,
    instructionRevisionId,
    instructionVersion,
    grantVersion,
    manifest,
    issuedAt,
    expiresAt,
  }) => {
    db.prepare(
      `INSERT INTO context_receipts(
         id, token_digest, receipt_digest, owner_id, agent_id, key_id, problem_id,
         context_version, instruction_revision_id, instruction_version, grant_version,
         manifest_json, issued_at, expires_at, acknowledged_at, run_id
       ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
    ).run(
      id,
      tokenDigest,
      ownerId,
      agentId,
      keyId,
      problemId,
      contextVersion,
      instructionRevisionId,
      instructionVersion,
      grantVersion,
      JSON.stringify(manifest || {}),
      issuedAt,
      expiresAt
    );

    const receipt = store.getContextReceiptById(id);
    store.putFirestoreDoc({
      path: `contextReceipts/${id}`,
      collectionPath: 'contextReceipts',
      docId: id,
      ownerId,
      visibility: 'owner',
      data: {
        id: receipt.id,
        ownerId: receipt.ownerId,
        agentId: receipt.agentId,
        problemId: receipt.problemId,
        contextVersion: receipt.contextVersion,
        instructionRevisionId: receipt.instructionRevisionId,
        instructionVersion: receipt.instructionVersion,
        grantVersion: receipt.grantVersion,
        issuedAt: receipt.issuedAt,
        expiresAt: receipt.expiresAt,
        acknowledgedAt: null,
      },
      now: issuedAt,
    });
    return receipt;
  };

  store.getContextReceiptById = (id) => {
    const row = db.prepare('SELECT * FROM context_receipts WHERE id=?').get(id);
    return hydrateReceipt(row);
  };

  store.getContextReceiptByTokenDigest = (tokenDigest) => {
    const row = db.prepare('SELECT * FROM context_receipts WHERE token_digest=?').get(tokenDigest);
    return hydrateReceipt(row);
  };

  store.getContextReceiptByReceiptDigest = (receiptDigest) => {
    const row = db.prepare('SELECT * FROM context_receipts WHERE receipt_digest=?').get(receiptDigest);
    return hydrateReceipt(row);
  };

  store.acknowledgeContextReceipt = ({ id, receiptDigest, acknowledgedAt, runId = null }) => {
    db.prepare(
      'UPDATE context_receipts SET receipt_digest=?, acknowledged_at=?, run_id=COALESCE(?, run_id) WHERE id=?'
    ).run(receiptDigest, acknowledgedAt, runId, id);
    const receipt = store.getContextReceiptById(id);
    if (receipt) {
      store.putFirestoreDoc({
        path: `contextReceipts/${id}`,
        collectionPath: 'contextReceipts',
        docId: id,
        ownerId: receipt.ownerId,
        visibility: 'owner',
        data: {
          id: receipt.id,
          ownerId: receipt.ownerId,
          agentId: receipt.agentId,
          problemId: receipt.problemId,
          contextVersion: receipt.contextVersion,
          instructionRevisionId: receipt.instructionRevisionId,
          instructionVersion: receipt.instructionVersion,
          grantVersion: receipt.grantVersion,
          issuedAt: receipt.issuedAt,
          expiresAt: receipt.expiresAt,
          acknowledgedAt: receipt.acknowledgedAt,
          runId: receipt.runId,
        },
        now: acknowledgedAt,
      });
    }
    return receipt;
  };

  store.latestAcknowledgedReceiptForAgent = (agentId) => {
    const row = db.prepare(
      'SELECT * FROM context_receipts WHERE agent_id=? AND acknowledged_at IS NOT NULL ORDER BY acknowledged_at DESC LIMIT 1'
    ).get(agentId);
    return hydrateReceipt(row);
  };

  store.insertAgentRun = ({
    id,
    ownerId,
    agentId,
    receiptId,
    problemId = null,
    contextVersion,
    instructionRevisionId,
    grantVersion,
    snapshot,
    created = Date.now(),
  }) => {
    db.prepare(
      `INSERT INTO agent_runs(
         id, owner_id, agent_id, receipt_id, problem_id, context_version,
         instruction_revision_id, grant_version, status, snapshot_json, created, stopped_at, stop_reason
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NULL, NULL)`
    ).run(
      id,
      ownerId,
      agentId,
      receiptId,
      problemId,
      contextVersion,
      instructionRevisionId,
      grantVersion,
      JSON.stringify(snapshot || {}),
      created
    );
    const run = store.getAgentRun(id);
    store.putFirestoreDoc({
      path: `runs/${id}`,
      collectionPath: 'runs',
      docId: id,
      ownerId,
      visibility: 'owner',
      data: run,
      now: created,
    });
    return run;
  };

  store.getAgentRun = (id) => {
    const row = db.prepare('SELECT * FROM agent_runs WHERE id=?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      ownerId: row.owner_id,
      agentId: row.agent_id,
      receiptId: row.receipt_id,
      problemId: row.problem_id ?? null,
      contextVersion: row.context_version,
      instructionRevisionId: row.instruction_revision_id,
      grantVersion: row.grant_version,
      status: row.status,
      snapshot: parseJson(row.snapshot_json, {}),
      createdAt: new Date(row.created).toISOString(),
      createdMs: row.created,
      stoppedAt: row.stopped_at ? new Date(row.stopped_at).toISOString() : null,
      stopReason: row.stop_reason ?? null,
    };
  };

  store.stopAgentRunsForAgent = (agentId, reason = 'stopped', now = Date.now()) => {
    const active = db.prepare("SELECT id FROM agent_runs WHERE agent_id=? AND status='active'").all(agentId);
    db.prepare(
      "UPDATE agent_runs SET status='stopped', stopped_at=?, stop_reason=? WHERE agent_id=? AND status='active'"
    ).run(now, reason, agentId);
    return active.length;
  };

  store.releaseActiveTasksForAgent = (agentId, reason = 'Immediate stop or grant pause; no handoff required.', now = Date.now()) => {
    const active = db.prepare("SELECT id, problem_id FROM tasks WHERE agent_id=? AND status='active' AND expires>?").all(agentId, now);
    for (const task of active) {
      db.prepare("UPDATE tasks SET status='released' WHERE id=?").run(task.id);
      store.insertEvent({
        type: 'released',
        agentId,
        problemId: task.problem_id,
        summary: reason,
        created: now,
      });
    }
    return active.map(t => t.id);
  };

  store.insertContextSuggestion = ({
    id,
    ownerId,
    agentId,
    problemId = null,
    title,
    suggestion,
    rationale,
    created = Date.now(),
  }) => {
    db.prepare(
      'INSERT INTO context_suggestions(id, owner_id, agent_id, problem_id, title, suggestion, rationale, status, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, ownerId, agentId, problemId, title, suggestion, rationale, 'pending', created);
    const record = {
      id,
      ownerId,
      agentId,
      problemId,
      title,
      suggestion,
      rationale,
      status: 'pending',
      visibility: 'owner',
      createdAt: new Date(created).toISOString(),
      createdMs: created,
    };
    store.putFirestoreDoc({
      path: `ownerInstructions/${ownerId}/suggestions/${id}`,
      collectionPath: `ownerInstructions/${ownerId}/suggestions`,
      docId: id,
      ownerId,
      visibility: 'owner',
      data: record,
      now: created,
    });
    return record;
  };

  store.listContextSuggestionsForOwner = (ownerId) => {
    return db.prepare(
      'SELECT * FROM context_suggestions WHERE owner_id=? ORDER BY created DESC'
    ).all(ownerId).map(row => ({
      id: row.id,
      ownerId: row.owner_id,
      agentId: row.agent_id,
      problemId: row.problem_id ?? null,
      title: row.title,
      suggestion: row.suggestion,
      rationale: row.rationale,
      status: row.status,
      visibility: 'owner',
      createdAt: new Date(row.created).toISOString(),
      createdMs: row.created,
    }));
  };

  store.insertIdentityAuditEvent = ({
    id,
    ownerId,
    actorKind,
    actorId,
    action,
    targetId = null,
    details = {},
    created = Date.now(),
  }) => {
    db.prepare(
      'INSERT INTO identity_audit_events(id, owner_id, actor_kind, actor_id, action, target_id, details_json, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, ownerId, actorKind, actorId, action, targetId, JSON.stringify(details), created);
    const event = {
      id,
      ownerId,
      actor: { kind: actorKind, id: actorId },
      action,
      targetId,
      details,
      createdAt: new Date(created).toISOString(),
      createdMs: created,
    };
    store.putFirestoreDoc({
      path: `auditEvents/${id}`,
      collectionPath: 'auditEvents',
      docId: id,
      ownerId,
      visibility: 'owner',
      data: event,
      now: created,
    });
    return event;
  };

  store.listIdentityAuditEventsForOwner = (ownerId, limit = 50) => {
    return db.prepare(
      'SELECT * FROM identity_audit_events WHERE owner_id=? ORDER BY created DESC LIMIT ?'
    ).all(ownerId, limit).map(row => ({
      id: row.id,
      ownerId: row.owner_id,
      actor: { kind: row.actor_kind, id: row.actor_id },
      action: row.action,
      targetId: row.target_id ?? null,
      details: parseJson(row.details_json, {}),
      createdAt: new Date(row.created).toISOString(),
      createdMs: row.created,
    }));
  };

  store.enforcesContextReceipts = (ownerId, agentId) => {
    if (ownerId && store.hasOwnerInstructions(ownerId)) return true;
    if (agentId && store.hasAgentGrant(agentId)) return true;
    if (isContractsTestStore || isLegacyProblemsTestStore) return false;
    return true;
  };
}
