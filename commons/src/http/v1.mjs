import { capabilitiesDocument, matchOtherMethod, matchUnavailable } from '../contracts/capabilities.mjs';
import { DomainError } from '../contracts/errors.mjs';
import { openApiDocument } from '../contracts/openapi.mjs';

export function handleV1(ctx) {
  const { method, path, url, commons, send } = ctx;
  if (method === 'GET' && path === '/api/v1/capabilities') {
    send(200, capabilitiesDocument());
    return true;
  }
  if (method === 'GET' && path === '/api/v1/openapi.json') {
    send(200, openApiDocument());
    return true;
  }
  if (method === 'GET' && path === '/api/v1/problems') {
    send(200, commons.v1Problems(url));
    return true;
  }
  const problem = path.match(/^\/api\/v1\/problems\/([^/]+)$/);
  if (method === 'GET' && problem) {
    send(200, commons.v1Problem(decodeURIComponent(problem[1])));
    return true;
  }
  return false;
}

export function rejectUnimplementedV1(method, path) {
  const unavailable = matchUnavailable(method, path);
  if (unavailable) {
    throw new DomainError(501, unavailable.summary, {
      code: 'UNAVAILABLE',
      details: { capability: unavailable.id, phase: unavailable.phase },
    });
  }
  if (matchOtherMethod(method, path)) {
    throw new DomainError(405, 'Method not allowed.', { code: 'METHOD_NOT_ALLOWED' });
  }
  throw new DomainError(404, 'Endpoint not found.', { code: 'NOT_FOUND' });
}
