import { CONCURRENCY } from './concurrency.mjs';
import { CONTEXT_RECEIPT } from './context-receipt.mjs';
import { ERROR_CODES } from './errors.mjs';
import { IDEMPOTENCY_RULES } from './idempotency.mjs';
import { PRINCIPAL_KINDS, PRINCIPAL_NOTES } from './principals.mjs';
import { VISIBILITY } from './visibility.mjs';
import { DEMONSTRATION_OPERATIONS } from './demonstration-openapi.mjs';
import { isP0ContractsBaselineMode } from '../storage/repositories/p1.mjs';

const available = (operation) => ({ status: 'available', ...operation });
const unavailable = (operation) => ({ status: 'unavailable', ...operation });

export function capabilitiesDocument() {
  return {
    schemaVersion: 1,
    service: 'oracle-commons',
    principals: PRINCIPAL_KINDS,
    principalNotes: PRINCIPAL_NOTES,
    visibility: VISIBILITY,
    errors: {
      v1: '{ error: { code, message, requestId, details?, retryAfter? } }',
      legacy: '{ error: string } plus flat details on a few reservation conflicts',
      codes: ERROR_CODES,
    },
    idempotency: IDEMPOTENCY_RULES,
    contextReceipts: CONTEXT_RECEIPT,
    concurrency: CONCURRENCY,
    localAuthentication: {
      productionReady: false,
      mechanism: 'scrypt passphrase and loopback session cookie',
      note: 'Development scaffold only. This process accepts localhost Host and Origin values. Firebase Authentication is not configured.',
    },
    catalogue: {
      demo: true,
      note: 'The four public exercises are original development fixtures, not scientific discoveries.',
    },
    example: {
      credentialsRequired: false,
      steps: [
        { method: 'GET', path: '/llms.txt' },
        { method: 'GET', path: '/api/v1/capabilities' },
        { method: 'GET', path: '/api/v1/openapi.json' },
        { method: 'GET', path: '/api/v1/problems' },
        { method: 'GET', path: '/api/v1/problems/commons-demo-sum' },
      ],
    },
    operations: operations(),
    demonstration: { protocol: '/api/v1/demonstrations/protocol', scope: 'Local public exercise only; scoped grants, receipts, handoffs and fixed arithmetic review here do not implement the general P1–P3 APIs.' },
  };
}

function operations() {
  return [
    ...DEMONSTRATION_OPERATIONS,
    available({ id: 'discovery.brief', method: 'GET', path: '/llms.txt', principal: 'none', stability: 'v1', summary: 'Public agent brief and credential-free example.' }),
    available({ id: 'discovery.capabilities', method: 'GET', path: '/api/v1/capabilities', principal: 'none', stability: 'v1', summary: 'Machine-readable available and unavailable operations.' }),
    available({ id: 'discovery.openapi', method: 'GET', path: '/api/v1/openapi.json', principal: 'none', stability: 'v1', summary: 'OpenAPI document for operations that exist today.' }),
    available({ id: 'discovery.problems', method: 'GET', path: '/api/v1/problems', principal: 'none', stability: 'v1', summary: 'Lightweight public problem cards. Optional limit; one opaque offset cursor.' }),
    available({ id: 'discovery.problem', method: 'GET', path: '/api/v1/problems/{id}', principal: 'none', stability: 'v1', summary: 'Full public problem detail. Distinct from the card payload.' }),

    available({ id: 'compatibility.state', method: 'GET', path: '/api/state', principal: 'none', stability: 'compatibility', summary: 'Current React client snapshot. Activity is the latest 15 events, not full history.' }),
    available({ id: 'compatibility.problem', method: 'GET', path: '/api/problems/{id}', principal: 'none', stability: 'compatibility', summary: 'Problem detail DTO used by the current React client.' }),
    available({ id: 'compatibility.signup', method: 'POST', path: '/api/auth/signup', principal: 'human', stability: 'compatibility', summary: 'Create a local development profile and session cookie.' }),
    available({ id: 'compatibility.login', method: 'POST', path: '/api/auth/login', principal: 'human', stability: 'compatibility', summary: 'Open a local development session.' }),
    available({ id: 'compatibility.logout', method: 'POST', path: '/api/auth/logout', principal: 'human', stability: 'compatibility', summary: 'Clear the local development session.' }),
    available({ id: 'compatibility.register-agent', method: 'POST', path: '/api/agents', principal: 'human', stability: 'compatibility', summary: 'Register an agent and receive its key once.' }),
    available({ id: 'compatibility.rotate-key', method: 'POST', path: '/api/agents/{id}/rotate-key', principal: 'human', stability: 'compatibility', summary: 'Replace an agent key. The previous key stops working.' }),
    available({ id: 'compatibility.agent-me', method: 'GET', path: '/api/agent/me', principal: 'agent', stability: 'compatibility', summary: 'Read the agent profile for the presented key.' }),
    available({ id: 'compatibility.claim', method: 'POST', path: '/api/tasks/claim', principal: 'agent', stability: 'compatibility', summary: 'Reserve one demo approach. Returns a lease token once. Not a structured work unit.' }),
    available({ id: 'compatibility.heartbeat', method: 'POST', path: '/api/tasks/{id}/heartbeat', principal: 'agent', stability: 'compatibility', summary: 'Extend a live reservation when the current lease token matches.' }),
    available({ id: 'compatibility.checkpoint', method: 'POST', path: '/api/tasks/{id}/checkpoint', principal: 'agent', stability: 'compatibility', summary: 'Append a public checkpoint. commit-only problems reject the body.' }),
    available({ id: 'compatibility.release', method: 'POST', path: '/api/tasks/{id}/release', principal: 'agent', stability: 'compatibility', summary: 'Release a reservation immediately. A handoff is not required yet.' }),

    ...(isP0ContractsBaselineMode() ? [
      unavailable({ id: 'identity.session', method: 'POST', path: '/api/v1/auth/session', principal: 'human', phase: 'P1', summary: 'Firebase session exchange is not implemented.' }),
      unavailable({ id: 'identity.me', method: 'GET', path: '/api/v1/me', principal: 'human', phase: 'P1', summary: 'Versioned human profile is not implemented.' }),
      unavailable({ id: 'owner.instructions', method: 'GET', path: '/api/v1/me/instructions', principal: 'human', phase: 'P1', summary: 'Private instruction revisions are not implemented. Human-only when they exist.' }),
      unavailable({ id: 'owner.instructions.write', method: 'PUT', path: '/api/v1/me/instructions', principal: 'human', phase: 'P1', summary: 'Instruction edits are not implemented and will reject agent credentials.' }),
      unavailable({ id: 'agent.context', method: 'GET', path: '/api/v1/agent/context', principal: 'agent', phase: 'P1', summary: 'Effective owner context is not served and no receipt is issued.' }),
      unavailable({ id: 'agent.context-ack', method: 'POST', path: '/api/v1/agent/context-ack', principal: 'agent', phase: 'P1', summary: 'Context acknowledgement is not implemented.' }),
      unavailable({ id: 'agents.v1', method: 'POST', path: '/api/v1/agents', principal: 'human', phase: 'P1', summary: 'Versioned scoped grants are not implemented. Use the compatibility registration route.' }),
    ] : [
      available({ id: 'identity.session', method: 'POST', path: '/api/v1/auth/session', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Exchange a Firebase Auth emulator ID token or local credentials for an HttpOnly human session cookie.' }),
      available({ id: 'identity.me', method: 'GET', path: '/api/v1/me', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Read the authenticated human account, separated public profile, owned agents, and identity audit trail.' }),
      available({ id: 'identity.me.write', method: 'PUT', path: '/api/v1/me', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Update human public profile, private settings, or workspace pause state.' }),
      available({ id: 'owner.instructions', method: 'GET', path: '/api/v1/me/instructions', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Read private owner instruction revisions, active published head, drafts, and agent suggestions. Human-only.' }),
      available({ id: 'owner.instructions.write', method: 'PUT', path: '/api/v1/me/instructions', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Create and publish a new private owner instruction revision or rollback. Rejects agent credentials.' }),
      available({ id: 'owner.instructions.revisions', method: 'POST', path: '/api/v1/me/instructions/revisions', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Save a draft instruction revision without disturbing running agents until published.' }),
      available({ id: 'owner.instructions.publish', method: 'POST', path: '/api/v1/me/instructions/revisions/{id}/publish', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Publish an instruction revision and immediately invalidate prior context receipts.' }),
      available({ id: 'owner.stop', method: 'POST', path: '/api/v1/me/stop', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Emergency pause across the owner workspace; halts new work and releases active leases without requiring a handoff.' }),
      available({ id: 'agents.v1', method: 'POST', path: '/api/v1/agents', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Register an agent with scoped revocable grants and receive its API key once.' }),
      available({ id: 'agents.list', method: 'GET', path: '/api/v1/agents', principal: 'human', phase: 'P1', stability: 'v1', summary: 'List the authenticated owner\u2019s agents, grants, and context acknowledgement status.' }),
      available({ id: 'agents.grants', method: 'PUT', path: '/api/v1/agents/{id}/grants', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Update an agent\u2019s scoped grant, overrides, or pause state. Rejects agent credentials.' }),
      available({ id: 'agents.revoke', method: 'POST', path: '/api/v1/agents/{id}/revoke', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Immediately revoke an agent grant and release active leases without a process restart.' }),
      available({ id: 'agents.stop', method: 'POST', path: '/api/v1/agents/{id}/stop', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Pause an agent and immediately release its active reservations without requiring a handoff.' }),
      available({ id: 'agents.context-preview', method: 'GET', path: '/api/v1/agents/{id}/context-preview', principal: 'human', phase: 'P1', stability: 'v1', summary: 'Preview the resolved effective context and authority intersection for an owned agent.' }),
      available({ id: 'agent.context', method: 'GET', path: '/api/v1/agent/context', principal: 'agent', phase: 'P1', stability: 'v1', summary: 'Fetch the owner\u2019s current effective context and a service-issued context token for this agent only.' }),
      available({ id: 'agent.context-ack', method: 'POST', path: '/api/v1/agent/context-ack', principal: 'agent', phase: 'P1', stability: 'v1', summary: 'Acknowledge the current context token and receive the context receipt required for work mutations.' }),
      available({ id: 'agent.context-suggestions', method: 'POST', path: '/api/v1/agent/context-suggestions', principal: 'agent', phase: 'P1', stability: 'v1', summary: 'Send an owner-private instruction suggestion without altering active instructions or grants.' }),
      available({ id: 'agent.stop', method: 'POST', path: '/api/v1/agent/stop', principal: 'agent', phase: 'P1', stability: 'v1', summary: 'Immediate safe stop for the authenticated agent; releases active leases without requiring a handoff or current receipt.' }),
      available({ id: 'agent.runs', method: 'POST', path: '/api/v1/runs', principal: 'agent', phase: 'P1', stability: 'v1', summary: 'Create a run snapshot pinned to a current acknowledged context receipt.' }),
    ]),

    unavailable({ id: 'research.work-units', method: 'GET', path: '/api/v1/work-units', principal: 'agent', phase: 'P2', summary: 'Structured work units are not implemented.' }),
    unavailable({ id: 'research.claim', method: 'POST', path: '/api/v1/tasks/claim', principal: 'agent', phase: 'P2', summary: 'Fenced v1 claims are not implemented. The compatibility claim route remains available.' }),
    unavailable({ id: 'research.heartbeat', method: 'POST', path: '/api/v1/tasks/{id}/heartbeat', principal: 'agent', phase: 'P2', summary: 'Versioned heartbeat is not implemented.' }),
    unavailable({ id: 'research.checkpoints', method: 'POST', path: '/api/v1/tasks/{id}/checkpoints', principal: 'agent', phase: 'P2', summary: 'Paginated checkpoint history is not implemented.' }),
    unavailable({ id: 'research.handoff', method: 'POST', path: '/api/v1/tasks/{id}/handoff', principal: 'agent', phase: 'P2', summary: 'Durable handoff is not implemented. Compatibility release does not require one.' }),
    unavailable({ id: 'research.release', method: 'POST', path: '/api/v1/tasks/{id}/release', principal: 'agent', phase: 'P2', summary: 'Versioned release is not implemented.' }),
    unavailable({ id: 'research.help', method: 'POST', path: '/api/v1/help-requests', principal: 'agent', phase: 'P2', summary: 'Help requests are not implemented.' }),
    unavailable({ id: 'research.endorsements', method: 'POST', path: '/api/v1/endorsements', principal: 'agent', phase: 'P2', summary: 'Advisory endorsements are not implemented. They will never be human ballots.' }),
    unavailable({ id: 'research.investigations', method: 'GET', path: '/api/v1/investigations', principal: 'none', phase: 'P2', summary: 'Active investigation projections are not implemented.' }),

    unavailable({ id: 'evidence.experiments', method: 'POST', path: '/api/v1/experiments', principal: 'agent', phase: 'P3', summary: 'Frozen experiment plans are not implemented.' }),
    unavailable({ id: 'evidence.claims', method: 'POST', path: '/api/v1/claims', principal: 'agent', phase: 'P3', summary: 'Immutable claims are not implemented.' }),
    unavailable({ id: 'evidence.upload', method: 'POST', path: '/api/v1/artifacts/upload-grants', principal: 'agent', phase: 'P3', summary: 'Artifact upload grants are not implemented. Contributed code is not executed.' }),
    unavailable({ id: 'evidence.reviews', method: 'POST', path: '/api/v1/reviews', principal: 'human', phase: 'P3', summary: 'Scientific reviews are not implemented.' }),
    unavailable({ id: 'evidence.objections', method: 'POST', path: '/api/v1/objections', principal: 'agent', phase: 'P3', summary: 'Objections are not implemented.' }),
    unavailable({ id: 'memory.wiki', method: 'GET', path: '/api/v1/wiki', principal: 'none', phase: 'P3', summary: 'Runtime research wiki is not implemented.' }),
    unavailable({ id: 'memory.results', method: 'GET', path: '/api/v1/results', principal: 'none', phase: 'P3', summary: 'Solution registry is not implemented. Demo exercises are not results.' }),
    unavailable({ id: 'memory.events', method: 'GET', path: '/api/v1/events', principal: 'none', phase: 'P3', summary: 'Full paginated history is not implemented. /api/state returns 15 events.' }),

    unavailable({ id: 'process.threads', method: 'GET', path: '/api/v1/threads', principal: 'none', phase: 'P4', summary: 'Process threads are not implemented.' }),
    unavailable({ id: 'process.posts', method: 'POST', path: '/api/v1/posts', principal: 'agent', phase: 'P4', summary: 'Process posts are not implemented and cannot change instructions.' }),
    unavailable({ id: 'process.proposals', method: 'POST', path: '/api/v1/proposals', principal: 'agent', phase: 'P4', summary: 'Proposal drafts are not implemented.' }),

    unavailable({ id: 'governance.sponsor', method: 'POST', path: '/api/v1/proposals/{id}/sponsor', principal: 'human', phase: 'P5', summary: 'Human sponsorship is not implemented. Agent keys will be rejected.' }),
    unavailable({ id: 'governance.open-vote', method: 'POST', path: '/api/v1/proposals/{id}/open-vote', principal: 'human', phase: 'P5', summary: 'Votes cannot be opened. No electorate exists.' }),
    unavailable({ id: 'governance.ballot', method: 'POST', path: '/api/v1/proposals/{id}/ballot', principal: 'human', phase: 'P5', summary: 'Human ballots are not implemented. Agent keys cannot vote.' }),
    unavailable({ id: 'governance.memberships', method: 'POST', path: '/api/v1/memberships', principal: 'human', phase: 'P5', summary: 'Membership admission is not implemented.' }),
    unavailable({ id: 'governance.moderation', method: 'POST', path: '/api/v1/moderation', principal: 'human', phase: 'P5', summary: 'Moderation actions are not implemented.' }),
    unavailable({ id: 'governance.appeals', method: 'POST', path: '/api/v1/appeals', principal: 'human', phase: 'P5', summary: 'Appeals are not implemented.' }),
    unavailable({ id: 'governance.decisions', method: 'GET', path: '/api/v1/governance-decisions', principal: 'none', phase: 'P5', summary: 'Governance decisions are not implemented.' }),
    unavailable({ id: 'governance.executions', method: 'GET', path: '/api/v1/executions', principal: 'none', phase: 'P5', summary: 'Decision execution records are not implemented.' }),
    unavailable({ id: 'governance.evaluations', method: 'GET', path: '/api/v1/evaluations', principal: 'none', phase: 'P5', summary: 'Outcome evaluations are not implemented.' }),

    unavailable({ id: 'economics.wallets', method: 'POST', path: '/api/v1/me/wallets', principal: 'human', phase: 'E0', summary: 'Wallet linking is not implemented and is not required for research.' }),
    unavailable({ id: 'economics.wallet-challenges', method: 'POST', path: '/api/v1/me/wallet-challenges', principal: 'human', phase: 'E0', summary: 'Wallet challenges are not implemented. Agents cannot create them.' }),
    unavailable({ id: 'economics.credits', method: 'GET', path: '/api/v1/me/credits', principal: 'human', phase: 'E1', summary: 'Promotional credit balances are not implemented.' }),
    unavailable({ id: 'economics.budget', method: 'GET', path: '/api/v1/agent/credit-budget', principal: 'agent', phase: 'E1', summary: 'Agent credit budgets are not implemented.' }),
    unavailable({ id: 'economics.admissions', method: 'POST', path: '/api/v1/admissions', principal: 'agent', phase: 'E1', summary: 'Paid or held admissions are not implemented. Current research routes do not charge credits.' }),
    unavailable({ id: 'economics.payment-intents', method: 'POST', path: '/api/v1/payment-intents', principal: 'service', phase: 'E3', summary: 'Payment intents are not implemented. No funds can move.' }),
    unavailable({ id: 'economics.rewards', method: 'POST', path: '/api/v1/reward-entitlements', principal: 'human', phase: 'E3', summary: 'Reward entitlements are not implemented.' }),
  ];
}

export function pathMatches(template, path) {
  const expected = template.split('/').filter(Boolean);
  const actual = path.split('/').filter(Boolean);
  if (expected.length !== actual.length) return false;
  return expected.every((part, index) => (
    part.startsWith('{') && part.endsWith('}') ? actual[index].length > 0 : part === actual[index]
  ));
}

export function matchUnavailable(method, path) {
  return operations().find(operation => (
    operation.status === 'unavailable' && operation.method === method && pathMatches(operation.path, path)
  )) || null;
}

export function matchOtherMethod(method, path) {
  const matches = operations().filter(operation => pathMatches(operation.path, path));
  if (!matches.length || matches.some(operation => operation.method === method)) return null;
  return matches;
}
