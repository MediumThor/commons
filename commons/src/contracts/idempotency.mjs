import { sha256 } from '../util/secret.mjs';
import { DomainError } from './errors.mjs';

/**
 * Idempotency-Key is scoped to principal, method, route, and request digest.
 * The helper and store methods exist. Live routes do not enforce the header yet.
 */
export const IDEMPOTENCY_RULES = {
  enforced: false,
  header: 'Idempotency-Key',
  scope: 'sha256(principalId, method, route, bodyDigest)',
  sameKeySameBody: 'replay the stored completed response',
  sameKeyDifferentBody: 'IDEMPOTENCY_CONFLICT',
  inProgress: 'a reserved key is not replayed and must not start a second effect',
  credentials: 'Do not store plaintext agent keys or lease tokens in idempotency receipts.',
};

export function requestDigest(body) {
  return sha256(JSON.stringify(body ?? null));
}

export function idempotencyScope({ principalId, method, route, bodyDigest }) {
  return sha256(JSON.stringify({ principalId, method, route, bodyDigest }));
}

export function decideIdempotency(existing, requestDigestValue) {
  if (!existing) return { action: 'reserve' };
  if (existing.request_digest !== requestDigestValue) {
    return { action: 'conflict' };
  }
  if (existing.status === 'completed') {
    return { action: 'replay', response: JSON.parse(existing.response_json) };
  }
  return { action: 'in_progress' };
}

export function idempotencyConflict() {
  return new DomainError(409, 'This idempotency key was already used with a different request body.', {
    code: 'IDEMPOTENCY_CONFLICT',
  });
}
