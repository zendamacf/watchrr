import { describe, expect, it } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { apiRoutes } from '@/lib/routes';
import { POST } from './route';

describe('POST /api/auth/logout', () => {
  it('returns 200 with ok body and clears the auth cookie', async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });

    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('is reachable at the logout API route path', () => {
    expect(apiRoutes.auth.logout).toBe('/api/auth/logout');
  });
});
