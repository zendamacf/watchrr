import { vi } from 'vitest';

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type FetchStub = () => Response | Promise<Response>;

export function mockFetchResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  const ok = options?.ok ?? true;
  const status = options?.status ?? (ok ? 200 : 400);

  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

export function fetchRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function stubFetch(response: Response): void;
export function stubFetch(impl: FetchStub): void;
export function stubFetch(impl: FetchHandler): void;
export function stubFetch(response: Response | FetchStub | FetchHandler) {
  const impl = typeof response === 'function' ? response : () => response;
  vi.stubGlobal('fetch', vi.fn().mockImplementation(impl as typeof fetch));
}
