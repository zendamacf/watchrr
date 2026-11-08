import { vi } from 'vitest';

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type FetchStub = () => Response | Promise<Response>;

export function mockFetchResponse(body: unknown, options?: { ok?: boolean; status?: number }) {
  const ok = options?.ok ?? true;
  const status = options?.status ?? (ok ? 200 : 400);

  return {
    ok,
    status,
    headers: new Headers(),
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

/** Response for a paginated list endpoint, with the `X-Total-Count` header set. */
export function mockPagedResponse(rows: unknown[], total = rows.length) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'X-Total-Count': String(total) }),
    json: async () => rows,
  } as Response;
}

/** Paged query-cache data (as stored by `useInfiniteQuery`) for seeding the QueryClient. */
export function pagedCache<T>(rows: T[], total = rows.length) {
  return { pages: [{ rows, total, offset: 0 }], pageParams: [0] };
}

/** Rows of the first cached page, for asserting optimistic updates and rollbacks. */
export function pagedRows<T>(data: unknown): T[] | undefined {
  return (data as { pages: { rows: T[] }[] } | undefined)?.pages[0]?.rows;
}
