import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes, routes } from '@/lib/routes';
import { apiFetch, isPublicAuthApiRequest, resetApiFetchStateForTests, resolveRequestPath } from './fetch';

describe('resolveRequestPath', () => {
  it('resolves relative API paths', () => {
    expect(resolveRequestPath('/api/movie')).toBe('/api/movie');
  });

  it('resolves absolute URLs', () => {
    expect(resolveRequestPath('https://example.com/api/movie')).toBe('/api/movie');
  });
});

describe('isPublicAuthApiRequest', () => {
  it('treats login and signup as public auth APIs', () => {
    expect(isPublicAuthApiRequest(apiRoutes.auth.login)).toBe(true);
    expect(isPublicAuthApiRequest(apiRoutes.auth.signup)).toBe(true);
  });

  it('treats protected APIs as non-public', () => {
    expect(isPublicAuthApiRequest(apiRoutes.movie)).toBe(false);
    expect(isPublicAuthApiRequest(apiRoutes.auth.logout)).toBe(false);
  });
});

describe('apiFetch', () => {
  const assign = vi.fn();

  beforeEach(() => {
    resetApiFetchStateForTests();
    vi.stubGlobal('fetch', vi.fn());
    assign.mockReset();
    Object.defineProperty(globalThis, 'window', {
      value: { location: { assign } },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the response without side effects for public auth 401s', async () => {
    const response = new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    vi.mocked(fetch).mockResolvedValueOnce(response);

    const result = await apiFetch(apiRoutes.auth.login, { method: 'POST' });

    expect(result).toBe(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it('clears the session and redirects on protected API 401s', async () => {
    const unauthorized = new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    const logoutOk = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized).mockResolvedValueOnce(logoutOk);

    const result = await apiFetch(apiRoutes.movie, { method: 'get' });

    expect(result).toBe(unauthorized);
    expect(fetch).toHaveBeenNthCalledWith(1, apiRoutes.movie, { method: 'get' });
    expect(fetch).toHaveBeenNthCalledWith(2, apiRoutes.auth.logout, { method: 'POST' });
    expect(assign).toHaveBeenCalledWith(routes.signin);
  });

  it('does not call logout more than once for concurrent 401s', async () => {
    const unauthorized = new Response(null, { status: 401 });
    const logoutOk = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.mocked(fetch)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(logoutOk);

    await Promise.all([apiFetch(apiRoutes.movie), apiFetch(apiRoutes.episode)]);

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenCalledWith(apiRoutes.auth.logout, { method: 'POST' });
    expect(assign).toHaveBeenCalledOnce();
  });
});
