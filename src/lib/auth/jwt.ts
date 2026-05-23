import { jwtVerify, SignJWT } from 'jose';
import { JWT_EXPIRY } from './constants';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error('AUTH_JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Invalid token subject');
  }
  return { sub: payload.sub };
}
