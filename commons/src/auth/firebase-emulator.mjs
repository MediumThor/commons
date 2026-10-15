import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DomainError } from '../contracts/errors.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMMONS_ROOT = resolve(HERE, '../..');

export function loadFirebaseEmulatorConfig() {
  const firebaserc = JSON.parse(readFileSync(resolve(COMMONS_ROOT, '.firebaserc'), 'utf8'));
  const firebaseJson = JSON.parse(readFileSync(resolve(COMMONS_ROOT, 'firebase.json'), 'utf8'));
  const firestoreRules = readFileSync(resolve(COMMONS_ROOT, 'firestore.rules'), 'utf8');
  const firestoreIndexes = JSON.parse(readFileSync(resolve(COMMONS_ROOT, 'firestore.indexes.json'), 'utf8'));
  const defaultProject = firebaserc?.projects?.default || '';

  return {
    projectId: defaultProject,
    emulatorOnly: defaultProject.startsWith('demo-'),
    firebaserc,
    firebaseJson,
    firestoreRules,
    firestoreIndexes,
  };
}

export function createEmulatorIdToken({
  uid,
  email = null,
  emailVerified = true,
  handle = null,
  displayName = null,
  principal = 'human',
  projectId = 'demo-oracle-commons',
  iat = Math.floor(Date.now() / 1000),
  exp = Math.floor(Date.now() / 1000) + 3600,
}) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: `https://securetoken.google.com/${projectId}`,
    aud: projectId,
    sub: uid,
    user_id: uid,
    uid,
    email,
    email_verified: emailVerified,
    handle,
    name: displayName,
    principal,
    iat,
    exp,
    firebase: { sign_in_provider: 'custom-emulator' },
  })).toString('base64url');
  return `${header}.${payload}.`;
}

export function verifyEmulatorIdToken(idToken, { now = Date.now(), expectedProjectId = 'demo-oracle-commons' } = {}) {
  if (typeof idToken !== 'string' || !idToken.trim()) {
    throw new DomainError(401, 'An emulator ID token is required.', { code: 'UNAUTHENTICATED' });
  }
  let claims;
  const parts = idToken.trim().split('.');
  if (parts.length >= 2) {
    try {
      claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      throw new DomainError(401, 'Malformed emulator JWT payload.', { code: 'UNAUTHENTICATED' });
    }
  } else {
    try {
      claims = JSON.parse(idToken);
    } catch {
      throw new DomainError(401, 'Malformed emulator ID token.', { code: 'UNAUTHENTICATED' });
    }
  }

  if (!claims || typeof claims !== 'object') {
    throw new DomainError(401, 'Invalid emulator token claims.', { code: 'UNAUTHENTICATED' });
  }
  if (claims.principal === 'agent' || String(claims.sub || '').startsWith('oc_')) {
    throw new DomainError(403, 'Agent credentials cannot exchange a human session.', {
      code: 'HUMAN_REQUIRED',
      details: { code: 'HUMAN_REQUIRED' },
    });
  }
  if (claims.aud && claims.aud !== expectedProjectId) {
    throw new DomainError(401, `Token audience "${claims.aud}" does not match emulator project "${expectedProjectId}".`, {
      code: 'UNAUTHENTICATED',
    });
  }
  const nowSeconds = Math.floor(now / 1000);
  if (typeof claims.exp === 'number' && claims.exp <= nowSeconds) {
    throw new DomainError(401, 'Emulator ID token has expired.', { code: 'UNAUTHENTICATED' });
  }
  const uid = String(claims.sub || claims.user_id || claims.uid || '').trim();
  if (!uid) {
    throw new DomainError(401, 'Emulator ID token is missing subject uid.', { code: 'UNAUTHENTICATED' });
  }
  if (claims.email && claims.email_verified === false) {
    throw new DomainError(403, 'Email address must be verified before opening a session.', { code: 'FORBIDDEN' });
  }

  return {
    uid,
    email: claims.email ?? null,
    emailVerified: claims.email_verified !== false,
    handle: claims.handle ?? null,
    displayName: claims.name ?? claims.displayName ?? null,
    principal: 'human',
    projectId: claims.aud || expectedProjectId,
  };
}

/**
 * Evaluates commons/firestore.rules against a simulated client SDK operation.
 * Returns { allowed, reason, ownerMatches, clientAccessAllowed, matchedCollection }.
 */
export function evaluateFirestoreSecurityRules({
  auth = null,
  path,
  method = 'get',
  rulesSource = loadFirebaseEmulatorConfig().firestoreRules,
} = {}) {
  const cleanPath = String(path || '').replace(/^\/+/, '').replace(/^databases\/[^/]+\/documents\//, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const collection = segments[0] || '';
  const docUid = segments[1] || '';

  const isSignedIn = Boolean(auth && typeof auth.uid === 'string' && auth.uid.length > 0);
  const principalKind = auth?.token?.principal ?? auth?.principal ?? (isSignedIn ? 'human' : null);
  const isHumanPrincipal = isSignedIn && principalKind === 'human';
  const ownerMatches = isHumanPrincipal && auth.uid === docUid;

  // Verify the rules file contains the expected deny-by-default and owner-isolation predicates
  const hasDenyByDefault = /match\s+\/\{document=\*\*\}\s*\{[\s\S]*?allow\s+read,\s*write:\s*if\s+false;/.test(rulesSource);
  const hasClientAccessFalse = /function\s+isClientAccessAllowed\(\)\s*\{\s*return\s+false;\s*\}/.test(rulesSource);
  const hasOwnerPredicate = /function\s+isOwner\(uid\)\s*\{\s*return\s+isHumanPrincipal\(\)\s*&&\s*request\.auth\.uid\s*==\s*uid;\s*\}/.test(rulesSource);

  const clientAccessAllowed = !hasClientAccessFalse && !hasDenyByDefault;

  if (collection === 'ownerInstructions' || collection === 'users') {
    const allowed = hasOwnerPredicate && ownerMatches && clientAccessAllowed;
    const reason = !isSignedIn
      ? 'UNAUTHENTICATED_CLIENT'
      : !isHumanPrincipal
        ? 'AGENT_PRINCIPAL_DENIED'
        : !ownerMatches
          ? 'CROSS_OWNER_DENIED'
          : 'CLIENT_DIRECT_ACCESS_DENIED';
    return {
      allowed,
      reason,
      ownerMatches,
      clientAccessAllowed,
      matchedCollection: collection,
      method,
      path: cleanPath,
    };
  }

  return {
    allowed: false,
    reason: 'CLIENT_DIRECT_ACCESS_DENIED',
    ownerMatches: false,
    clientAccessAllowed: false,
    matchedCollection: collection || 'root',
    method,
    path: cleanPath,
  };
}

export function createFirestoreEmulatorGuard(store) {
  const config = loadFirebaseEmulatorConfig();

  function clientRead(auth, path) {
    const decision = evaluateFirestoreSecurityRules({
      auth,
      path,
      method: 'get',
      rulesSource: config.firestoreRules,
    });
    if (!decision.allowed) {
      throw new DomainError(403, `Firestore client Security Rules denied read on "${decision.path}" (${decision.reason}).`, {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', decision },
      });
    }
    return store.getFirestoreDoc(path);
  }

  function clientWrite(auth, path, data) {
    const decision = evaluateFirestoreSecurityRules({
      auth,
      path,
      method: 'write',
      rulesSource: config.firestoreRules,
    });
    if (!decision.allowed) {
      throw new DomainError(403, `Firestore client Security Rules denied write on "${decision.path}" (${decision.reason}).`, {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', decision },
      });
    }
    return store.putFirestoreDoc({ path, collectionPath: path.split('/')[0], docId: path.split('/')[1] || 'doc', data });
  }

  function serverReadOwnerDocument(principal, path) {
    if (!principal || !principal.id) {
      throw new DomainError(401, 'Authentication is required.', { code: 'UNAUTHENTICATED' });
    }
    if (principal.kind !== 'human') {
      throw new DomainError(403, 'Human owner authority is required to read private instruction documents.', {
        code: 'HUMAN_REQUIRED',
        details: { code: 'HUMAN_REQUIRED' },
      });
    }
    const cleanPath = String(path || '').replace(/^\/+/, '');
    const parts = cleanPath.split('/');
    const targetOwnerId = parts[0] === 'ownerInstructions' || parts[0] === 'users' ? parts[1] : null;
    if (targetOwnerId && targetOwnerId !== principal.ownerId) {
      throw new DomainError(403, 'You cannot read another owner\u2019s private instruction documents.', {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', reason: 'CROSS_OWNER_DENIED' },
      });
    }
    const doc = store.getFirestoreDoc(cleanPath);
    if (!doc) {
      throw new DomainError(404, 'Document not found.', { code: 'NOT_FOUND' });
    }
    if (doc.ownerId && doc.ownerId !== principal.ownerId) {
      throw new DomainError(403, 'You cannot read another owner\u2019s private document.', {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', reason: 'CROSS_OWNER_DENIED' },
      });
    }
    return doc;
  }

  function serverListOwnerCollection(principal, collectionPath) {
    if (!principal || !principal.id) {
      throw new DomainError(401, 'Authentication is required.', { code: 'UNAUTHENTICATED' });
    }
    if (principal.kind !== 'human') {
      throw new DomainError(403, 'Human owner authority is required.', {
        code: 'HUMAN_REQUIRED',
        details: { code: 'HUMAN_REQUIRED' },
      });
    }
    const cleanPath = String(collectionPath || '').replace(/^\/+/, '');
    const parts = cleanPath.split('/');
    if (parts[0] === 'ownerInstructions' && parts[1] && parts[1] !== principal.ownerId) {
      throw new DomainError(403, 'You cannot list another owner\u2019s instruction revisions.', {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', reason: 'CROSS_OWNER_DENIED' },
      });
    }
    return store.listFirestoreCollection(cleanPath).filter(doc => doc.ownerId === principal.ownerId);
  }

  return {
    config,
    evaluateRules: evaluateFirestoreSecurityRules,
    clientRead,
    clientWrite,
    serverReadOwnerDocument,
    serverListOwnerCollection,
  };
}
