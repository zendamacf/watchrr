import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRequestUrl, mockFetchResponse, stubFetch } from '@/test/fetch';
import { createTestQueryClient, renderHookWithProviders } from '@/test/renderHook';
import { browserRegion, useRecommendationDetails } from './useRecommendationDetails';

const details = { tagline: null, genres: ['Drama'], rating: 8, votes: 1, providers: [], cast: [] };

describe('browserRegion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the region from the browser locale', () => {
    vi.stubGlobal('navigator', { language: 'en-NZ' });
    expect(browserRegion()).toBe('NZ');
  });

  it('is undefined when the locale has no region or is invalid', () => {
    vi.stubGlobal('navigator', { language: 'en' });
    expect(browserRegion()).toBeUndefined();
    vi.stubGlobal('navigator', { language: 'not a locale' });
    expect(browserRegion()).toBeUndefined();
  });
});

describe('useRecommendationDetails', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { language: 'en-NZ' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays idle without a target', () => {
    stubFetch(mockFetchResponse(details));
    const { result } = renderHookWithProviders(() => useRecommendationDetails(null));

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requests the title with the browser region', async () => {
    stubFetch(mockFetchResponse(details));
    const { result } = renderHookWithProviders(() => useRecommendationDetails({ type: 'movie', moviedb_id: 680 }));

    await waitFor(() => expect(result.current.data).toEqual(details));
    const url = new URL(fetchRequestUrl(vi.mocked(fetch).mock.calls[0]?.[0] as string), 'http://localhost');
    expect(url.pathname).toBe('/api/recommendations/details');
    expect(Object.fromEntries(url.searchParams)).toEqual({ type: 'movie', moviedb_id: '680', region: 'NZ' });
  });

  it('omits the region when the locale has none', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    stubFetch(mockFetchResponse(details));
    renderHookWithProviders(() => useRecommendationDetails({ type: 'tvshow', moviedb_id: 1 }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetchRequestUrl(vi.mocked(fetch).mock.calls[0]?.[0] as string)).not.toContain('region');
  });

  it('reuses the cached result instead of fetching again', async () => {
    stubFetch(mockFetchResponse(details));
    const queryClient = createTestQueryClient();
    const target = { type: 'movie' as const, moviedb_id: 680 };

    const first = renderHookWithProviders(() => useRecommendationDetails(target), { queryClient });
    await waitFor(() => expect(first.result.current.data).toBeDefined());
    first.unmount();
    const second = renderHookWithProviders(() => useRecommendationDetails(target), { queryClient });

    expect(second.result.current.data).toEqual(details);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('surfaces the API error message', async () => {
    stubFetch(mockFetchResponse({ message: 'Could not load details from TMDB' }, { ok: false, status: 502 }));
    const { result } = renderHookWithProviders(() => useRecommendationDetails({ type: 'movie', moviedb_id: 1 }));

    await waitFor(() => expect(result.current.error?.message).toBe('Could not load details from TMDB'), {
      timeout: 3000,
    });
  });
});
