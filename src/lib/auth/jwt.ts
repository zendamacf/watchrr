import { jwtVerify, SignJWT } from 'jose';
import { JWT_EXPIRY } from './constants';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error('AUTH_JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(userId: string, tokenVersion: number): Promise<string> {
  return new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; tv: number }> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Invalid token subject');
  }
  // Tokens without a version claim predate session invalidation and are rejected.
  if (typeof payload.tv !== 'number' || !Number.isInteger(payload.tv)) {
    throw new Error('Invalid token version');
  }
  return { sub: payload.sub, tv: payload.tv };
}
