import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { apiRoutes } from '@/lib/routes';
import { fetchRequestUrl, mockFetchResponse, mockPagedResponse, pagedCache, pagedRows, stubFetch } from '@/test/fetch';
import { testRecommendation, testShowRecommendation } from '@/test/fixtures/recommendation';
import { createTestQueryClient, renderHookWithProviders } from '@/test/renderHook';
import {
  recommendationId,
  useNotInterested,
  useRecommendationsQuery,
  useRemoveRecommendation,
} from './useRecommendations';

const mockShowError = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({ showError: mockShowError, showSuccess: vi.fn() }),
}));

const listKey = [QueryKey.getRecommendations, {}, 100];

describe('recommendationId', () => {
  it('distinguishes a movie from a show with the same TMDB id', () => {
    expect(recommendationId({ type: 'movie', moviedb_id: 1 })).not.toBe(
      recommendationId({ type: 'tvshow', moviedb_id: 1 }),
    );
  });
});

describe('useRecommendationsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads recommendations and the total', async () => {
    stubFetch(mockPagedResponse([testRecommendation, testShowRecommendation], 5));
    const { result } = renderHookWithProviders(() => useRecommendationsQuery());

    await waitFor(() => expect(result.current.recommendations).toHaveLength(2));
    expect(result.current.total).toBe(5);
  });

  it('sends the type filter', async () => {
    stubFetch(mockPagedResponse([]));
    renderHookWithProviders(() => useRecommendationsQuery({ type: 'movie' }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetchRequestUrl(vi.mocked(fetch).mock.calls[0]?.[0] as string)).toContain('type=movie');
  });
});

describe('useRemoveRecommendation', () => {
  it('removes only the matching type and id from the cache', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKey, pagedCache([testRecommendation, { ...testShowRecommendation, moviedb_id: 680 }]));
    const { result } = renderHookWithProviders(() => useRemoveRecommendation(), { queryClient });

    act(() => result.current({ type: 'movie', moviedb_id: 680 }));

    expect(pagedRows(queryClient.getQueryData(listKey))).toEqual([{ ...testShowRecommendation, moviedb_id: 680 }]);
  });
});

describe('useNotInterested', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes the card immediately and posts the choice', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKey, pagedCache([testRecommendation, testShowRecommendation]));
    stubFetch(mockFetchResponse({ message: 'Success' }, { status: 201 }));
    const { result } = renderHookWithProviders(() => useNotInterested(), { queryClient });

    act(() => result.current.mutate(testRecommendation));

    await waitFor(() => expect(pagedRows(queryClient.getQueryData(listKey))).toEqual([testShowRecommendation]));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      apiRoutes.notInterested,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ type: 'movie', moviedb_id: 680 }) }),
    );
  });

  it('restores the card and reports an error when the request fails', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKey, pagedCache([testRecommendation]));
    // The failed request is followed by a refetch, which must also fail so the cache keeps the snapshot.
    stubFetch(mockFetchResponse({ message: 'nope' }, { ok: false, status: 500 }));
    const { result } = renderHookWithProviders(() => useNotInterested(), { queryClient });

    act(() => result.current.mutate(testRecommendation));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('nope') })),
    );
    expect(pagedRows(queryClient.getQueryData(listKey))).toEqual([testRecommendation]);
  });
});
