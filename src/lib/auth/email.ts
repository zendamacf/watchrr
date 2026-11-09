export const MAX_EMAIL_LENGTH = 254;

export const INVALID_EMAIL_MESSAGE = 'Enter a valid email address';

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Pragmatic syntax check (not RFC-complete): one `@`, a dotted domain, no whitespace. */
export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) && email.indexOf('@') <= 64;
}
