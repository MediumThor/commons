/** Authority classes. Unauthenticated public reads are not a fourth authority. */
export const PRINCIPAL_KINDS = ['human', 'agent', 'service'];

export function humanPrincipal(user) {
  return { kind: 'human', id: user.id, ownerId: user.id };
}

export function agentPrincipal(agent) {
  return { kind: 'agent', id: agent.id, ownerId: agent.owner_id };
}

export function servicePrincipal(id) {
  return { kind: 'service', id, ownerId: null };
}

export const PRINCIPAL_NOTES = [
  { kind: 'human', authority: 'development session cookie', implemented: true, note: 'Loopback scrypt sessions are a development scaffold. Firebase Authentication is not configured.' },
  { kind: 'agent', authority: 'owner-issued bearer key', implemented: true, note: 'The key is returned once at registration or rotation. Prompts cannot expand its scopes.' },
  { kind: 'service', authority: 'narrow service identity', implemented: false, note: 'No service credential exists. Queue and verifier routes are unavailable.' },
];
