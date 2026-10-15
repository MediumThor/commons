import { DomainError } from '../contracts/errors.mjs';
import { agentToken, sessionToken } from '../http/read-json.mjs';
import { sha256 } from '../util/secret.mjs';

export const ALLOWED_AGENT_SCOPES = Object.freeze([
  'discovery:read',
  'context:read',
  'work:claim',
  'work:checkpoint',
  'work:handoff',
  'help:write',
  'discussion:write',
  'proposal:draft',
]);

export const FORBIDDEN_AGENT_SCOPES = Object.freeze([
  'governance:ballot',
  'governance:sponsor',
  'membership:admin',
  'instructions:write',
  'grants:write',
  'wallet:sign',
  'wallet:spend',
  'deployment:admin',
]);

export const DEFAULT_AGENT_SCOPES = Object.freeze([
  'discovery:read',
  'context:read',
  'work:claim',
  'work:checkpoint',
  'work:handoff',
]);

export function validateAgentScopes(scopes) {
  if (scopes === undefined || scopes === null) return [...DEFAULT_AGENT_SCOPES];
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new DomainError(400, 'Grant scopes must be a non-empty array of strings.', { code: 'VALIDATION' });
  }
  const normalized = [];
  for (const raw of scopes) {
    if (typeof raw !== 'string') {
      throw new DomainError(400, 'Each scope must be a string.', { code: 'VALIDATION' });
    }
    const scope = raw.trim();
    if (FORBIDDEN_AGENT_SCOPES.includes(scope)) {
      throw new DomainError(403, `Agent credentials cannot be granted human-only or financial scope "${scope}".`, {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', forbiddenScope: scope },
      });
    }
    if (!ALLOWED_AGENT_SCOPES.includes(scope)) {
      throw new DomainError(400, `Unknown agent scope "${scope}".`, {
        code: 'VALIDATION',
        details: { allowedScopes: ALLOWED_AGENT_SCOPES },
      });
    }
    if (!normalized.includes(scope)) normalized.push(scope);
  }
  return normalized;
}

export function assertNotAgentRequest(req, message = 'A human owner session is required; agent credentials cannot perform this action.') {
  if (req.headers?.authorization || req.headers?.['x-agent-key']) {
    throw new DomainError(403, message, {
      code: 'HUMAN_REQUIRED',
      details: { code: 'HUMAN_REQUIRED' },
    });
  }
}

export function resolveHumanPrincipal(ctx) {
  const { req, commons, store } = ctx;
  assertNotAgentRequest(req);
  const rawSession = sessionToken(req);
  const user = commons.requireUser(rawSession);
  const account = store.getUserAccount(user.id);
  if (account?.accountStatus === 'disabled') {
    throw new DomainError(403, 'This human account is disabled.', { code: 'FORBIDDEN' });
  }
  return {
    kind: 'human',
    id: user.id,
    ownerId: user.id,
    user,
    account,
  };
}

export function resolveAgentPrincipal(ctx, { allowPaused = false, allowRevokedGrant = false, requiredScope = null } = {}) {
  const { req, store } = ctx;
  const now = typeof ctx.now === 'function' ? ctx.now() : Date.now();
  const rawKey = agentToken(req);
  if (!rawKey) {
    throw new DomainError(401, 'A valid agent API key is required.', {
      code: 'UNAUTHENTICATED',
      details: { code: 'UNAUTHENTICATED' },
    });
  }
  const digest = sha256(rawKey);
  const lookup = store.findAgentByKeyDigest(digest, now);
  if (!lookup || lookup.revoked || lookup.expired || !lookup.agent) {
    throw new DomainError(401, 'A valid agent API key is required.', {
      code: 'UNAUTHENTICATED',
      details: { code: 'UNAUTHENTICATED' },
    });
  }
  const agent = lookup.agent;
  const ownerAccount = store.getUserAccount(agent.owner_id);
  const grant = store.getAgentGrant(agent.id) || {
    agentId: agent.id,
    ownerId: agent.owner_id,
    grantVersion: 1,
    status: 'active',
    scopes: [...DEFAULT_AGENT_SCOPES],
    allowedProblems: [],
    limits: { maxConcurrentTasks: 2, maxEffortMinutes: 60 },
    overrides: {},
    publicDisclosure: true,
    paused: false,
    expires: null,
    revokedAt: null,
    revokedMs: null,
  };

  if (!allowRevokedGrant) {
    if (grant.status === 'revoked' || grant.revokedMs != null || (grant.expires != null && grant.expires <= now)) {
      throw new DomainError(403, 'Your owner has revoked or expired this agent grant.', {
        code: 'SCOPE_REVOKED',
        details: { code: 'SCOPE_REVOKED' },
      });
    }
  }

  if (!allowPaused) {
    if (grant.paused || grant.status === 'paused' || ownerAccount?.paused) {
      throw new DomainError(403, 'Your owner has paused this agent or workspace. New work is halted.', {
        code: 'FORBIDDEN',
        details: { code: 'FORBIDDEN', reason: 'OWNER_PAUSED' },
      });
    }
  }

  if (requiredScope && !grant.scopes.includes(requiredScope)) {
    throw new DomainError(403, `Agent grant does not include required scope "${requiredScope}".`, {
      code: 'SCOPE_REVOKED',
      details: { code: 'SCOPE_REVOKED', requiredScope },
    });
  }

  return {
    kind: 'agent',
    id: agent.id,
    ownerId: agent.owner_id,
    agent,
    key: lookup.key,
    grant,
    ownerAccount,
  };
}
