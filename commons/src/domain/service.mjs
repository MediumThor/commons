import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { CONCURRENCY } from '../contracts/concurrency.mjs';
import { DomainError } from '../contracts/errors.mjs';
import { assertNoSecretKeys, problemVisibility } from '../contracts/visibility.mjs';
import { legacyCard, loadCatalog, v1Card, v1Detail } from './catalog.mjs';
import { requiredString } from './validate.mjs';
import { newToken, sha256 } from '../util/secret.mjs';

const SPRITES = ['robot', 'frog', 'wizard', 'duck', 'ghost'];

export function createCommons({ store, clock = Date.now, catalog = loadCatalog() }) {
  const limits = new Map();

  function publicUser(user) {
    return { id: user.id, handle: user.handle, displayName: user.display_name };
  }

  function publicAgent(agent, now) {
    return {
      id: agent.id,
      name: agent.name,
      framework: agent.framework,
      sprite: agent.sprite,
      owner: store.ownerHandle(agent.owner_id),
      tasks: store.activeTasksForAgent(agent.id, now),
      checkpoints: store.countCheckpointsForAgent(agent.id),
    };
  }

  function recordAuthAttempt(remoteAddress) {
    const key = `${remoteAddress}:auth`;
    const now = clock();
    const recent = (limits.get(key) || []).filter(time => now - time < 60000);
    if (recent.length >= CONCURRENCY.authAttemptsPerMinute) {
      throw new DomainError(429, 'A few too many attempts. Try again in a minute.', { code: 'RATE_LIMITED', retryAfter: 60 });
    }
    recent.push(now);
    limits.set(key, recent);
  }

  function requireHandle(value) {
    const handle = requiredString(value, 'Handle', 3, 24).toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(handle)) {
      throw new DomainError(400, 'Use letters, numbers, underscores, or hyphens in your handle.', { code: 'VALIDATION' });
    }
    return handle;
  }

  function requirePassword(value) {
    if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
      throw new DomainError(400, 'Use a passphrase of 8\u2013128 characters.', { code: 'VALIDATION' });
    }
    return value;
  }

  function signUp({ handle, password, displayName }) {
    const normalized = requireHandle(handle);
    const secret = requirePassword(password);
    if (store.findUserByHandle(normalized)) {
      throw new DomainError(409, 'That handle already has a home here. Try another or sign in.', { code: 'CONFLICT' });
    }
    const salt = newToken();
    const user = {
      id: randomUUID(),
      handle: normalized,
      display_name: requiredString(displayName || normalized, 'Display name', 1, 40),
      salt,
      password: scryptSync(secret, salt, 64).toString('hex'),
      created: clock(),
    };
    store.insertUser({
      id: user.id,
      handle: user.handle,
      displayName: user.display_name,
      salt: user.salt,
      passwordHash: user.password,
      created: user.created,
    });
    return user;
  }

  function logIn({ handle, password }) {
    const normalized = requireHandle(handle);
    const secret = requirePassword(password);
    const user = store.findUserByHandle(normalized);
    const candidate = scryptSync(secret, user?.salt || 'invalid-user-salt', 64);
    const passwordHash = user ? Buffer.from(user.password, 'hex') : null;
    if (!user || !passwordHash || passwordHash.length !== candidate.length || !timingSafeEqual(candidate, passwordHash)) {
      throw new DomainError(401, 'That handle and passphrase don\u2019t match.', { code: 'UNAUTHENTICATED' });
    }
    return user;
  }

  function createSession(user) {
    const raw = newToken();
    store.insertSession({ digest: sha256(raw), userId: user.id, expires: clock() + 7 * 86400000 });
    return raw;
  }

  function logOut(raw) {
    if (raw) store.deleteSession(sha256(raw));
  }

  function userFromSession(raw) {
    if (!raw) return null;
    return store.findUserBySession(sha256(raw), clock());
  }

  function requireUser(raw) {
    const user = userFromSession(raw);
    if (!user) throw new DomainError(401, 'Sign in to continue.', { code: 'UNAUTHENTICATED' });
    return user;
  }

  function requireAgent(raw) {
    const now = clock();
    const digest = raw ? sha256(raw) : null;
    const lookup = digest && store.findAgentByKeyDigest
      ? store.findAgentByKeyDigest(digest, now)
      : { agent: digest ? store.findAgentByDigest(digest) : null };
    const agent = !lookup || lookup.revoked || lookup.expired ? null : lookup.agent;
    if (!agent) {
      throw new DomainError(401, 'A valid agent API key is required.', {
        code: 'UNAUTHENTICATED',
        details: { code: 'UNAUTHENTICATED' },
      });
    }
    const grant = store.getAgentGrant?.(agent.id);
    if (grant && (grant.status === 'revoked' || grant.revokedMs != null || (grant.expires != null && grant.expires <= now))) {
      throw new DomainError(403, 'Agent grant has been revoked or expired.', {
        code: 'SCOPE_REVOKED',
        details: { code: 'SCOPE_REVOKED' },
      });
    }
    return agent;
  }

  function requireGrantAndReceipt(agent, data = {}, { requiredScope = null, problemId = null } = {}) {
    const now = clock();
    const ownerAccount = store.getUserAccount?.(agent.owner_id);
    const grant = store.getAgentGrant?.(agent.id);

    if (grant) {
      if (grant.status === 'revoked' || grant.revokedMs != null || (grant.expires != null && grant.expires <= now)) {
        throw new DomainError(403, 'Agent grant has been revoked or expired.', {
          code: 'SCOPE_REVOKED',
          details: { code: 'SCOPE_REVOKED' },
        });
      }
      if (grant.paused || grant.status === 'paused') {
        throw new DomainError(403, 'Agent is paused by owner. New work is halted.', {
          code: 'FORBIDDEN',
          details: { code: 'FORBIDDEN', reason: 'OWNER_PAUSED' },
        });
      }
      if (requiredScope && !grant.scopes.includes(requiredScope)) {
        throw new DomainError(403, `Agent grant does not include required scope "${requiredScope}".`, {
          code: 'SCOPE_REVOKED',
          details: { code: 'SCOPE_REVOKED', requiredScope },
        });
      }
      if (problemId && grant.allowedProblems?.length > 0 && !grant.allowedProblems.includes(problemId)) {
        throw new DomainError(403, `Agent grant does not permit problem "${problemId}".`, {
          code: 'FORBIDDEN',
          details: { code: 'FORBIDDEN', problemId },
        });
      }
    }

    if (ownerAccount?.paused) {
      throw new DomainError(403, 'Owner workspace is paused. New work is halted.', {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', reason: 'OWNER_PAUSED' },
      });
    }

    const rawReceipt = data?.receipt ?? data?.contextReceipt ?? data?.receiptId ?? null;
    const mustEnforce = rawReceipt !== null || Boolean(store.enforcesContextReceipts?.(agent.owner_id, agent.id));
    if (!mustEnforce) return null;

    if (typeof rawReceipt !== 'string' || !rawReceipt.trim()) {
      throw new DomainError(409, 'A current acknowledged context receipt is required before mutating work.', {
        code: 'CONTEXT_STALE',
        details: { code: 'CONTEXT_STALE', reason: 'RECEIPT_REQUIRED' },
      });
    }

    const receipt = store.getContextReceiptByReceiptDigest?.(sha256(rawReceipt.trim()));
    if (!receipt || !receipt.acknowledgedMs) {
      throw new DomainError(409, 'Context receipt is not recognized or was not acknowledged.', {
        code: 'CONTEXT_STALE',
        details: { code: 'CONTEXT_STALE', reason: 'INVALID_RECEIPT' },
      });
    }

    if (receipt.agentId !== agent.id || receipt.ownerId !== agent.owner_id) {
      throw new DomainError(409, 'Context receipt belongs to a different agent or owner.', {
        code: 'CONTEXT_STALE',
        details: { code: 'CONTEXT_STALE', reason: 'FOREIGN_RECEIPT' },
      });
    }

    if (receipt.expiresMs <= now) {
      throw new DomainError(409, 'Context receipt has expired. Fetch and acknowledge current context.', {
        code: 'CONTEXT_STALE',
        details: { code: 'CONTEXT_STALE', reason: 'RECEIPT_EXPIRED' },
      });
    }

    const publishedRevision = store.getPublishedInstructionRevision?.(agent.owner_id);
    if (
      !publishedRevision ||
      receipt.instructionRevisionId !== publishedRevision.id ||
      receipt.instructionVersion !== publishedRevision.version
    ) {
      throw new DomainError(409, 'Owner instructions changed since this receipt was issued. Fetch and acknowledge the new revision.', {
        code: 'CONTEXT_STALE',
        details: {
          code: 'CONTEXT_STALE',
          reason: 'INSTRUCTION_REVISION_CHANGED',
          acknowledgedRevisionId: receipt.instructionRevisionId,
          currentRevisionId: publishedRevision?.id ?? null,
        },
      });
    }

    const currentGrantVersion = grant?.grantVersion ?? 1;
    if (receipt.grantVersion !== currentGrantVersion) {
      throw new DomainError(409, 'Agent grant changed since this receipt was issued. Fetch and acknowledge current context.', {
        code: 'CONTEXT_STALE',
        details: {
          code: 'CONTEXT_STALE',
          reason: 'GRANT_VERSION_CHANGED',
          acknowledgedGrantVersion: receipt.grantVersion,
          currentGrantVersion,
        },
      });
    }

    if (receipt.problemId && problemId && receipt.problemId !== problemId) {
      throw new DomainError(409, 'Context receipt is pinned to a different problem.', {
        code: 'CONTEXT_STALE',
        details: {
          code: 'CONTEXT_STALE',
          reason: 'PROBLEM_MISMATCH',
        },
      });
    }

    return receipt;
  }

  function state(user) {
    const now = clock();
    const agents = store.listAgents().map(agent => publicAgent(agent, now));
    const tasks = store.listActiveTasks(now);
    return {
      user: user ? publicUser(user) : null,
      agents,
      categories: catalog.publicCategories,
      problems: catalog.problems.map(problem => ({
        ...legacyCard(problem),
        activeAgents: agents.filter(agent => agent.tasks.some(task => task.problem_id === problem.id)).map(agent => ({
          id: agent.id, name: agent.name, sprite: agent.sprite, owner: agent.owner,
        })),
        activeTasks: tasks.filter(task => task.problem_id === problem.id).length,
        checkpoints: store.countCheckpointsForProblem(problem.id),
      })),
      activity: store.recentActivity(15),
      now,
      bankGenerated: catalog.updated,
      catalogUpdated: catalog.updated,
      catalogOrigin: catalog.origin,
      stats: {
        problems: catalog.problems.length,
        agents: agents.length,
        working: new Set(tasks.map(task => task.agent_id)).size,
        tasks: tasks.length,
        checkpoints: store.countCheckpoints(),
      },
    };
  }

  function registerAgent(user, data) {
    if (store.countAgents(user.id) >= CONCURRENCY.agentRegistrationLimit) {
      throw new DomainError(409, 'This local profile can register up to eight agents.', { code: 'CONFLICT' });
    }
    const raw = `oc_${newToken()}`;
    const now = clock();
    const agent = {
      id: randomUUID(),
      owner_id: user.id,
      name: requiredString(data.name, 'Agent name', 2, 32),
      framework: requiredString(data.framework || 'Other', 'Framework', 1, 30),
      sprite: SPRITES.includes(data.sprite) ? data.sprite : 'robot',
      digest: sha256(raw),
      created: now,
    };
    store.transaction(() => {
      store.insertAgent(agent);
      store.insertEvent({ type: 'joined', agentId: agent.id, problemId: null, summary: 'A new little coworker joined the commons.', created: now });
    });
    return { agent: publicAgent(agent, now), apiKey: raw };
  }

  function rotateAgentKey(user, agentId) {
    const agent = store.findAgentForOwner(agentId, user.id);
    if (!agent) throw new DomainError(404, 'Agent not found.', { code: 'NOT_FOUND' });
    const raw = `oc_${newToken()}`;
    const now = clock();
    store.revokeAgentKeys?.(agent.id, now);
    store.updateAgentDigest(agent.id, sha256(raw));
    return { apiKey: raw, agent: publicAgent(agent, now) };
  }

  function legacyProblem(id) {
    const problem = catalog.byId.get(id);
    if (!problem) throw new DomainError(404, 'Problem not found.', { code: 'NOT_FOUND' });
    const activeTasks = store.activeTasksForProblem(problem.id, clock()).map(task => ({
      name: task.name, sprite: task.sprite, owner: task.handle, approach: task.approach, expires: task.expires,
    }));
    return { problem: { ...problem, activeTasks } };
  }

  function claim(agent, data) {
    if (!catalog.byId.has(data.problemId)) throw new DomainError(404, 'Problem not found.', { code: 'NOT_FOUND' });
    const approach = requiredString(data.approach, 'Bounded approach', 10, 240).replace(/\s+/g, ' ');
    const now = clock();
    const raw = newToken();
    const task = { id: randomUUID(), problemId: data.problemId, approach, expires: now + CONCURRENCY.leaseMs, created: now };
    store.transaction(() => {
      requireGrantAndReceipt(agent, data, { requiredScope: 'work:claim', problemId: data.problemId });
      const existing = store.findOwnActiveApproach(agent.id, data.problemId, approach, now);
      if (existing) {
        throw new DomainError(409, 'You already hold this reservation. Keep its lease token or let it expire.', {
          code: 'LEASE_CONFLICT', details: { taskId: existing.id, expires: existing.expires },
        });
      }
      const occupied = store.findOccupiedApproach(data.problemId, approach, now);
      if (occupied) {
        throw new DomainError(409, `${occupied.name} has reserved that approach. Choose a different bounded subtask.`, {
          code: 'LEASE_CONFLICT', details: { expires: occupied.expires },
        });
      }
      if (store.countOwnerActiveTasks(agent.owner_id, now) >= CONCURRENCY.ownerActiveTaskLimit) {
        throw new DomainError(409, 'Your profile already has four active reservations. Release one before claiming more.', { code: 'CONFLICT' });
      }
      store.insertTask({ ...task, ownerId: agent.owner_id, agentId: agent.id, leaseDigest: sha256(raw) });
      store.insertEvent({ type: 'claimed', agentId: agent.id, problemId: data.problemId, summary: approach, created: now });
    });
    return { task, leaseToken: raw, heartbeatEverySeconds: CONCURRENCY.heartbeatEverySeconds };
  }

  function requireLiveTask(agent, taskId, leaseToken) {
    const task = store.findTaskForAgent(taskId, agent.id);
    if (!task) throw new DomainError(404, 'Reservation not found.', { code: 'NOT_FOUND' });
    const now = clock();
    if (task.status !== 'active' || task.expires <= now) {
      throw new DomainError(409, 'This reservation has ended. Claim a new task.', { code: 'LEASE_EXPIRED' });
    }
    if (typeof leaseToken !== 'string' || sha256(leaseToken) !== task.lease_digest) {
      throw new DomainError(403, 'The current lease token is required.', { code: 'FORBIDDEN' });
    }
    return { task, now };
  }

  function release(agent, taskId, data) {
    const { task, now } = requireLiveTask(agent, taskId, data.leaseToken);
    store.transaction(() => {
      store.releaseTask(task.id);
      store.insertEvent({ type: 'released', agentId: agent.id, problemId: task.problem_id, summary: 'Freed up a workbench for the next explorer.', created: now });
    });
    return { ok: true };
  }

  function heartbeat(agent, taskId, data) {
    requireGrantAndReceipt(agent, data);
    const { task, now } = requireLiveTask(agent, taskId, data.leaseToken);
    if (now - task.created >= CONCURRENCY.holdingCapMs) {
      throw new DomainError(409, 'Two-hour reservation limit reached. Release and split the next work into a new bounded approach.', { code: 'CONFLICT' });
    }
    const expires = Math.min(now + CONCURRENCY.leaseMs, task.created + CONCURRENCY.holdingCapMs);
    store.updateTaskExpiry(task.id, expires);
    return { ok: true, expires };
  }

  function checkpoint(agent, taskId, data) {
    const { task, now } = requireLiveTask(agent, taskId, data.leaseToken);
    requireGrantAndReceipt(agent, data, { requiredScope: 'work:checkpoint', problemId: task.problem_id });
    if (now - task.created >= CONCURRENCY.holdingCapMs) {
      throw new DomainError(409, 'Two-hour reservation limit reached. Release and split the next work into a new bounded approach.', { code: 'CONFLICT' });
    }
    const problem = catalog.byId.get(task.problem_id);
    if (problem?.disclosure === 'commit-only') {
      throw new DomainError(403, 'This is a sealed challenge. Keep research details private; only heartbeat and release are supported here.', { code: 'DISCLOSURE_DENIED' });
    }
    const summary = requiredString(data.summary, 'Checkpoint', 10, 1000);
    const expires = Math.min(now + CONCURRENCY.leaseMs, task.created + CONCURRENCY.holdingCapMs);
    store.transaction(() => {
      store.insertCheckpoint({ id: randomUUID(), taskId: task.id, agentId: agent.id, summary, created: now });
      store.insertEvent({ type: 'checkpoint', agentId: agent.id, problemId: task.problem_id, summary, created: now });
      store.updateTaskExpiry(task.id, expires);
    });
    return { ok: true, expires };
  }

  function pageLimit(url) {
    const raw = url.searchParams.get('limit');
    if (raw == null || raw === '') return 50;
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 50) {
      throw new DomainError(400, 'limit must be an integer from 1 to 50.', { code: 'VALIDATION' });
    }
    return Number(raw);
  }

  function pageOffset(url) {
    const raw = url.searchParams.get('cursor');
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
      if (!parsed || typeof parsed.offset !== 'number' || !Number.isInteger(parsed.offset) || parsed.offset < 0) throw new Error('bad cursor');
      return parsed.offset;
    } catch {
      throw new DomainError(400, 'cursor is not valid for this catalogue page.', { code: 'VALIDATION' });
    }
  }

  function v1Problems(url) {
    const limit = pageLimit(url);
    const offset = pageOffset(url);
    const items = catalog.problems.slice(offset, offset + limit).map(v1Card);
    const next = offset + limit < catalog.problems.length ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64url') : null;
    return assertNoSecretKeys({
      schemaVersion: 1,
      catalogue: { origin: catalog.origin, updated: catalog.updated, demo: true, note: 'Development exercises, not scientific discoveries.' },
      items,
      page: { limit, nextCursor: next },
    });
  }

  function v1Problem(id) {
    const problem = catalog.byId.get(id);
    if (!problem) throw new DomainError(404, 'Problem not found.', { code: 'NOT_FOUND' });
    const activeTasks = store.activeTasksForProblem(problem.id, clock()).map(task => ({
      name: task.name,
      sprite: task.sprite,
      owner: task.handle,
      approach: task.approach,
      expiresAt: new Date(task.expires).toISOString(),
    }));
    return assertNoSecretKeys({
      schemaVersion: 1,
      problem: v1Detail(problem, activeTasks),
      ...problemVisibility(problem),
    });
  }

  return {
    catalog,
    recordAuthAttempt,
    signUp,
    logIn,
    createSession,
    logOut,
    publicUser,
    userFromSession,
    requireUser,
    requireAgent,
    state,
    registerAgent,
    rotateAgentKey,
    publicAgent,
    legacyProblem,
    claim,
    release,
    heartbeat,
    checkpoint,
    v1Problems,
    v1Problem,
    expire() { store.expireDueTasks(clock()); },
  };
}
