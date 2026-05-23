import { apiRoutes } from '@/lib/routes';
import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_COOKIE_NAME } from './constants';
import { signAccessToken } from './jwt';
import {
  authenticateHeaders,
  authenticateRequest,
  getTokenFromCookie,
  parseBearerToken,
  resolveAuthToken,
} from './session';

const userId = 'e1e31db5-d029-4ba7-aa65-fd6a5e7fdea';

describe('parseBearerToken', () => {
  it('returns null for missing or invalid authorization', () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken('Basic abc')).toBeNull();
    expect(parseBearerToken('Bearer ')).toBeNull();
  });

  it('extracts the token after Bearer', () => {
    expect(parseBearerToken('Bearer my-token')).toBe('my-token');
    expect(parseBearerToken('Bearer  spaced  ')).toBe('spaced');
  });
});

describe('getTokenFromCookie', () => {
  it('returns null when cookie header is missing or name not found', () => {
    expect(getTokenFromCookie(null, AUTH_COOKIE_NAME)).toBeNull();
    expect(getTokenFromCookie('other=value', AUTH_COOKIE_NAME)).toBeNull();
  });

  it('extracts and decodes the named cookie', () => {
    const header = `foo=bar; ${AUTH_COOKIE_NAME}=token%2Fwith%2Fslashes; baz=qux`;
    expect(getTokenFromCookie(header, AUTH_COOKIE_NAME)).toBe('token/with/slashes');
  });
});

describe('resolveAuthToken', () => {
  it('prefers Bearer over cookie', () => {
    const headers = new Headers({
      authorization: 'Bearer from-header',
      cookie: `${AUTH_COOKIE_NAME}=from-cookie`,
    });
    expect(resolveAuthToken(headers)).toBe('from-header');
  });

  it('falls back to cookie when Authorization is absent', () => {
    const headers = new Headers({
      cookie: `${AUTH_COOKIE_NAME}=from-cookie`,
    });
    expect(resolveAuthToken(headers)).toBe('from-cookie');
  });
});

describe('authenticateHeaders', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
  });

  it('returns userId for a valid Bearer token', async () => {
    const token = await signAccessToken(userId);
    const headers = new Headers({ authorization: `Bearer ${token}` });
    await expect(authenticateHeaders(headers)).resolves.toEqual({ userId });
  });

  it('returns userId for a valid cookie token', async () => {
    const token = await signAccessToken(userId);
    const headers = new Headers({ cookie: `${AUTH_COOKIE_NAME}=${token}` });
    await expect(authenticateHeaders(headers)).resolves.toEqual({ userId });
  });

  it('returns null when token is missing or invalid', async () => {
    expect(await authenticateHeaders(new Headers())).toBeNull();
    const headers = new Headers({ authorization: 'Bearer not-a-jwt' });
    expect(await authenticateHeaders(headers)).toBeNull();
  });
});

describe('authenticateRequest', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
  });

  it('delegates to request headers', async () => {
    const token = await signAccessToken(userId);
    const request = new Request(`http://localhost${apiRoutes.episode}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    await expect(authenticateRequest(request)).resolves.toEqual({ userId });
  });
});
