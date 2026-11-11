import { QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { fetchRequestUrl, mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderHookWithProviders } from '@/test/renderHook';
import { invalidateStats, useShowStatsQuery, useStatsQuery } from './useStats';

describe('useStatsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests overall stats with the range and browser timezone', async () => {
    stubFetch(mockFetchResponse({ episodes: { total: 1 } }));
    const { result } = renderHookWithProviders(() => useStatsQuery({ from: '2026-01-01', to: '2026-02-01' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const url = fetchRequestUrl(vi.mocked(fetch).mock.calls[0]![0]);
    expect(url).toContain('/api/stats?');
    expect(url).toContain('from=2026-01-01');
    expect(url).toContain('to=2026-02-01');
    expect(url).toContain('tz=');
  });

  it('surfaces the API error message', async () => {
    stubFetch(mockFetchResponse({ message: 'Unauthorized' }, { ok: false, status: 401 }));
    const { result } = renderHookWithProviders(() => useStatsQuery());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useShowStatsQuery', () => {
  it('requests stats for the given show', async () => {
    stubFetch(mockFetchResponse({ watched: 0 }));
    const { result } = renderHookWithProviders(() => useShowStatsQuery('show-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchRequestUrl(vi.mocked(fetch).mock.calls[0]![0])).toContain('/api/tvshow/show-1/stats');
  });
});

describe('invalidateStats', () => {
  it('invalidates overall and per-show stats', () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');
    invalidateStats(client);
    expect(spy).toHaveBeenCalledWith({ queryKey: [QueryKey.getStats] });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QueryKey.getShowStats] });
  });
});
