import { beforeEach, describe, expect, it } from 'vitest';
import { getJwtSecret, signAccessToken, verifyAccessToken } from './jwt';

const userId = 'e1e31db5-d029-4ba7-aa65-fd6a5e7fdea';

describe('jwt', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
  });

  it('getJwtSecret throws when AUTH_JWT_SECRET is unset', () => {
    delete process.env.AUTH_JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('AUTH_JWT_SECRET is not set');
  });

  it('signAccessToken and verifyAccessToken round-trip', async () => {
    const token = await signAccessToken(userId);
    const { sub } = await verifyAccessToken(token);
    expect(sub).toBe(userId);
  });

  it('verifyAccessToken rejects a tampered token', async () => {
    const token = await signAccessToken(userId);
    const parts = token.split('.');
    parts[2] = 'invalid-signature';
    await expect(verifyAccessToken(parts.join('.'))).rejects.toThrow();
  });

  it('verifyAccessToken rejects a token signed with a different secret', async () => {
    const token = await signAccessToken(userId);
    process.env.AUTH_JWT_SECRET = 'other-secret';
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('verifyAccessToken rejects a token without a subject', async () => {
    const { SignJWT } = await import('jose');
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('test-jwt-secret'));
    await expect(verifyAccessToken(token)).rejects.toThrow('Invalid token subject');
  });

  it('verifyAccessToken rejects an expired token', async () => {
    const { SignJWT } = await import('jose');
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt(now - 7200)
      .setExpirationTime(now - 3600)
      .sign(new TextEncoder().encode('test-jwt-secret'));
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});
