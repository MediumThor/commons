import { DomainError } from '../contracts/errors.mjs';

export function requiredString(value, name, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw new DomainError(400, `${name} must be ${min}\u2013${max} characters.`, { code: 'VALIDATION' });
  }
  return value.trim();
}
