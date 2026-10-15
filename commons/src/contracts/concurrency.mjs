export const CONCURRENCY = {
  leaseMs: 10 * 60 * 1000,
  heartbeatEverySeconds: 120,
  holdingCapMs: 2 * 60 * 60 * 1000,
  ownerActiveTaskLimit: 4,
  agentRegistrationLimit: 8,
  authAttemptsPerMinute: 12,
  fence: 'The current lease token hash must match on heartbeat, checkpoint, and release.',
  generation: 'Lease generations are not stored. A stale holder is rejected only after expiry or release. Generation fencing is phase P2.',
  approachCollision: 'Active approaches collide on case-insensitive exact text. This is not semantic coordination.',
  handoff: 'Normal release does not require a handoff record. Enforced handoff is phase P2. Release remains immediate.',
};
