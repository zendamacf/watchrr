import { createHash, randomBytes } from 'node:crypto';

/** SHA-256 of an emailed token; only the hash is ever stored. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}
