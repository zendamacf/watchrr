import { vi } from 'vitest';

export function mockFetchResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  const ok = options?.ok ?? true;
  const status = options?.status ?? (ok ? 200 : 400);

  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

export function stubFetch(response: Response | (() => Response | Promise<Response>)) {
  const impl = typeof response === 'function' ? response : () => response;
  vi.stubGlobal('fetch', vi.fn().mockImplementation(impl));
}
