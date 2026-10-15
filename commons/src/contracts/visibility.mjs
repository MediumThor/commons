export const VISIBILITY = ['public', 'member', 'owner', 'restricted'];

const SECRET_KEYS = new Set([
  'password', 'passwordHash', 'salt', 'digest', 'lease_digest', 'leaseDigest',
  'leaseToken', 'apiKey', 'authorization',
]);

/** Public catalogue rows stay listable. commit-only limits what a checkpoint may publish. */
export function problemVisibility(problem) {
  return {
    visibility: 'public',
    disclosure: problem.disclosure,
    checkpointBody: problem.disclosure === 'commit-only' ? 'rejected' : 'public-event',
  };
}

export function findSecretKeys(value, path = '$', found = []) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findSecretKeys(item, `${path}[${index}]`, found));
    return found;
  }
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEYS.has(key)) found.push(`${path}.${key}`);
    else findSecretKeys(child, `${path}.${key}`, found);
  }
  return found;
}

export function assertNoSecretKeys(value) {
  const found = findSecretKeys(value);
  if (found.length) {
    throw new Error(`Public projection contains secret keys: ${found.join(', ')}`);
  }
  return value;
}
