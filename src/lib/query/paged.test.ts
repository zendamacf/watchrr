import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPagedResponse } from '@/test/fetch';
import { fetchPage, flattenPages, pagedQueryOptions, restorePaged, snapshotPaged, totalOf, updatePaged } from './paged';

const cache = (rows: { id: number }[], total = rows.length) => ({
  pages: [{ rows, total, offset: 0 }],
  pageParams: [0],
});

describe('fetchPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends params, limit and offset and reads the total header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockPagedResponse([{ id: 1 }], 7));

    const page = await fetchPage('/api/x', { search: 'a b', status: undefined }, 20, 10);

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/x?search=a+b&limit=10&offset=20');
    expect(page).toEqual({ rows: [{ id: 1 }], total: 7, offset: 20 });
  });

  it('assumes the last page when the total header is missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => [{ id: 1 }],
    } as Response);

    expect((await fetchPage('/api/x', {}, 0)).total).toBe(1);
  });

  it('throws the API error message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      headers: new Headers(),
      json: async () => ({ message: 'boom' }),
    } as Response);

    await expect(fetchPage('/api/x', {}, 0)).rejects.toThrow('boom');
  });
});

describe('pagedQueryOptions', () => {
  const next = pagedQueryOptions('k', '/api/x').getNextPageParam as (last: unknown) => number | undefined;

  it('includes params in the query key', () => {
    expect(pagedQueryOptions('k', '/api/x', { search: 'a' }).queryKey).toEqual(['k', { search: 'a' }]);
  });

  it('returns the next offset while rows remain', () => {
    expect(next({ rows: [{}, {}], total: 5, offset: 0 })).toBe(2);
  });

  it('stops on the last page, an exactly-full final page, and an empty page', () => {
    expect(next({ rows: [{}], total: 3, offset: 2 })).toBeUndefined();
    expect(next({ rows: [{}, {}], total: 2, offset: 0 })).toBeUndefined();
    expect(next({ rows: [], total: 9, offset: 0 })).toBeUndefined();
  });
});

describe('paged cache helpers', () => {
  it('flattens pages and reads the latest total', () => {
    const data = {
      pages: [
        { rows: [{ id: 1 }], total: 3, offset: 0 },
        { rows: [{ id: 2 }], total: 3, offset: 1 },
      ],
      pageParams: [0, 1],
    };
    expect(flattenPages(data)).toEqual([{ id: 1 }, { id: 2 }]);
    expect(totalOf(data)).toBe(3);
    expect(flattenPages(undefined)).toEqual([]);
    expect(totalOf(undefined)).toBe(0);
  });

  it('updates every cached variant, lowers totals on removal, and restores from a snapshot', () => {
    const client = new QueryClient();
    client.setQueryData(['k', {}], cache([{ id: 1 }, { id: 2 }], 5));
    client.setQueryData(['k', { search: 'a' }], cache([{ id: 1 }], 1));
    client.setQueryData(['other', {}], cache([{ id: 1 }]));
    const snapshot = snapshotPaged(client, 'k');

    updatePaged<{ id: number }>(client, 'k', (rows) => rows.filter((r) => r.id !== 1));

    expect(flattenPages(client.getQueryData(['k', {}]))).toEqual([{ id: 2 }]);
    expect(totalOf(client.getQueryData(['k', {}]))).toBe(4);
    expect(flattenPages(client.getQueryData(['k', { search: 'a' }]))).toEqual([]);
    expect(totalOf(client.getQueryData(['k', { search: 'a' }]))).toBe(0);
    expect(flattenPages(client.getQueryData(['other', {}]))).toEqual([{ id: 1 }]);

    restorePaged(client, snapshot);
    expect(flattenPages(client.getQueryData(['k', {}]))).toEqual([{ id: 1 }, { id: 2 }]);
    expect(totalOf(client.getQueryData(['k', {}]))).toBe(5);
  });

  it('keeps totals when rows are only modified', () => {
    const client = new QueryClient();
    client.setQueryData(['k', {}], cache([{ id: 1 }], 4));
    updatePaged<{ id: number }>(client, 'k', (rows) => rows.map((r) => ({ ...r, id: r.id + 1 })));
    expect(totalOf(client.getQueryData(['k', {}]))).toBe(4);
  });
});
