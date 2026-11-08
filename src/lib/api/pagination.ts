import { NextResponse } from 'next/server';

/** Default page size. */
export const DEFAULT_PAGE_SIZE = 100;
/** Largest accepted `limit`. */
export const MAX_PAGE_SIZE = 500;

export const TOTAL_COUNT_HEADER = 'X-Total-Count';

export type Pagination = { limit: number; offset: number };

/** Parse `limit` and `offset` (defaults 100 and 0), or return a 400 response if invalid. */
export function parsePagination(url: URL): Pagination | NextResponse {
  const rawLimit = url.searchParams.get('limit');
  const rawOffset = url.searchParams.get('offset');
  const limit = rawLimit === null ? DEFAULT_PAGE_SIZE : Number(rawLimit);
  const offset = rawOffset === null ? 0 : Number(rawOffset);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return NextResponse.json({ message: `limit must be an integer between 1 and ${MAX_PAGE_SIZE}` }, { status: 400 });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ message: 'offset must be a non-negative integer' }, { status: 400 });
  }
  return { limit, offset };
}

/** JSON response with the total row count in `X-Total-Count`. */
export function paginatedJson<T>(data: T[], total: number) {
  return NextResponse.json(data, { status: 200, headers: { [TOTAL_COUNT_HEADER]: String(total) } });
}

/** Longest accepted `search` term. */
export const MAX_SEARCH_LENGTH = 100;

/** Escape LIKE wildcards so input matches literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** `search` param as a `%term%` LIKE pattern, or `null` if absent or blank. */
export function parseSearchPattern(url: URL): string | null {
  const term = url.searchParams.get('search')?.trim().slice(0, MAX_SEARCH_LENGTH);
  return term ? `%${escapeLike(term)}%` : null;
}
