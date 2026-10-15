import { DomainError } from '../contracts/errors.mjs';

export async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw new DomainError(415, 'Send application/json.', { code: 'UNSUPPORTED_MEDIA' });
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16384) throw new DomainError(413, 'Request too large.', { code: 'PAYLOAD_TOO_LARGE' });
  }
  try {
    const value = JSON.parse(raw || '{}');
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('bad json');
    return value;
  } catch (error) {
    if (error.status) throw error;
    throw new DomainError(400, 'Invalid JSON object.', { code: 'VALIDATION' });
  }
}

export function sessionToken(req) {
  return req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('oc_session='))?.slice(11) || null;
}

export function agentToken(req) {
  return req.headers.authorization?.match(/^Bearer (oc_[A-Za-z0-9_-]+)$/)?.[1] || null;
}
