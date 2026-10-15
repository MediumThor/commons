/** Structured codes for /api/v1. Legacy routes still return `{error: string}`. */
export const ERROR_CODES = [
  'VALIDATION',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'HUMAN_REQUIRED',
  'NOT_FOUND',
  'CONFLICT',
  'CONTEXT_STALE',
  'SCOPE_REVOKED',
  'LEASE_EXPIRED',
  'LEASE_CONFLICT',
  'VERSION_CONFLICT',
  'HANDOFF_REQUIRED',
  'DISCLOSURE_DENIED',
  'RATE_LIMITED',
  'CREDIT_LIMIT',
  'HOLD_EXPIRED',
  'PAYMENT_UNCONFIRMED',
  'RECONCILIATION_PAUSED',
  'IDEMPOTENCY_CONFLICT',
  'UNAVAILABLE',
  'METHOD_NOT_ALLOWED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA',
  'INTERNAL',
];

const STATUS_CODES = {
  400: 'VALIDATION',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA',
  429: 'RATE_LIMITED',
  501: 'UNAVAILABLE',
  503: 'UNAVAILABLE',
};

export class DomainError extends Error {
  constructor(status, message, { code, details = {}, retryAfter } = {}) {
    super(message);
    this.status = status;
    this.code = code || STATUS_CODES[status] || 'INTERNAL';
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

export const fail = (status, message, options) => { throw new DomainError(status, message, options); };

export function legacyErrorBody(error) {
  if (!error?.status) return { error: 'Something went wrong. Please try again.' };
  return { error: error.message, ...(error.details || {}) };
}

export function structuredErrorBody(error, requestId) {
  const status = error?.status;
  const body = {
    error: {
      code: status ? (error.code || STATUS_CODES[status] || 'INTERNAL') : 'INTERNAL',
      message: status ? error.message : 'Something went wrong. Please try again.',
      requestId,
    },
  };
  if (status && error.details && Object.keys(error.details).length) body.error.details = error.details;
  if (status && error.retryAfter) body.error.retryAfter = error.retryAfter;
  return body;
}
