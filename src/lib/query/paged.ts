import { type InfiniteData, infiniteQueryOptions, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetch';
import { DEFAULT_PAGE_SIZE, TOTAL_COUNT_HEADER } from '@/lib/api/paginationConstants';

/** One loaded page: its rows, the server's total match count, and its starting offset. */
export type Page<T> = { rows: T[]; total: number; offset: number };
/** Query-cache shape for a paged list. */
export type PagedData<T> = InfiniteData<Page<T>, unknown>;
/** Filter params sent with each request; empty values are omitted. */
export type PagedParams = Record<string, string | undefined>;

/**
 * Fetch one page of a list endpoint, reading the total from `X-Total-Count`
 * (a missing header is treated as the last page). Throws the API's error message on failure.
 */
export async function fetchPage<T>(
  path: string,
  params: PagedParams,
  offset: number,
  limit = DEFAULT_PAGE_SIZE,
): Promise<Page<T>> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  search.set('limit', String(limit));
  search.set('offset', String(offset));

  const response = await apiFetch(`${path}?${search}`, { method: 'get' });
  if (!response.ok) throw new Error((await response.json()).message);

  const rows: T[] = await response.json();
  const header = response.headers.get(TOTAL_COUNT_HEADER);
  // Without a total, assume this was the last page.
  const total = header === null ? offset + rows.length : Number(header);
  return { rows, total, offset };
}

/**
 * `useInfiniteQuery` options for a paginated list endpoint. The query key is `[key, params]`, so
 * each filter combination caches separately but a `[key]` prefix still matches all of them.
 */
export function pagedQueryOptions<T>(key: string, path: string, params: PagedParams = {}) {
  return infiniteQueryOptions({
    queryKey: [key, params] as QueryKey,
    queryFn: ({ pageParam }) => fetchPage<T>(path, params, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last: Page<T>) => {
      const next = last.offset + last.rows.length;
      return last.rows.length > 0 && next < last.total ? next : undefined;
    },
  });
}

/**
 * All loaded rows, in order, without duplicates. Offsets are server positions, so a row removed
 * optimistically can make the next page repeat a row until the list refetches.
 */
export function flattenPages<T>(data: PagedData<T> | undefined, getId: (row: T) => string): T[] {
  const seen = new Set<string>();
  return (data?.pages ?? []).flatMap((page) =>
    page.rows.filter((row) => {
      const id = getId(row);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }),
  );
}

/** Server-side total matching the current filters, including rows not yet loaded. */
export function totalOf<T>(data: PagedData<T> | undefined): number {
  return data?.pages.at(-1)?.total ?? 0;
}

/** Cached entries for every filter variant of a paged list. */
type Snapshot = [QueryKey, PagedData<unknown> | undefined][];

/** Capture every cached variant of a paged list, for rolling back an optimistic update. */
export function snapshotPaged(queryClient: QueryClient, key: string): Snapshot {
  return queryClient.getQueriesData<PagedData<unknown>>({ queryKey: [key] });
}

/** Restore a `snapshotPaged` result into the cache. */
export function restorePaged(queryClient: QueryClient, snapshot: Snapshot | undefined) {
  for (const [queryKey, data] of snapshot ?? []) queryClient.setQueryData(queryKey, data);
}

/** Apply `mapRows` to every cached variant of a paged list; totals drop by the number of rows removed. */
export function updatePaged<T>(queryClient: QueryClient, key: string, mapRows: (rows: T[]) => T[]) {
  queryClient.setQueriesData<PagedData<T>>({ queryKey: [key] }, (old) => {
    if (!old) return old;
    const removed = old.pages.reduce((n, p) => n + p.rows.length - mapRows(p.rows).length, 0);
    return {
      ...old,
      pages: old.pages.map((page) => ({ ...page, rows: mapRows(page.rows), total: Math.max(0, page.total - removed) })),
    };
  });
}
