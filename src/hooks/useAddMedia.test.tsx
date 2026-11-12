import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { createTestQueryClient, renderHookWithProviders } from '@/test/renderHook';
import { useAddMovie, useAddShow } from './useAddMedia';

const { mockShowError, mockShowSuccess, mockRefresh } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));
vi.mock('@/hooks/useRefresh', () => ({
  useRefreshShow: () => ({ refresh: mockRefresh, refreshPending: false }),
}));

describe('useAddMovie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the TMDB id, confirms, refreshes the movie list and calls onAdded', async () => {
    stubFetch(mockFetchResponse({ message: 'Success', movie_id: 'm1' }, { status: 201 }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onAdded = vi.fn();
    const { result } = renderHookWithProviders(() => useAddMovie({ onAdded }), { queryClient });

    act(() => result.current.mutate({ moviedb_id: 680, name: 'Pulp Fiction' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      apiRoutes.movie,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ moviedb_id: 680 }) }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Pulp Fiction') }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QueryKey.getMovies] });
    expect(onAdded).toHaveBeenCalledWith({ moviedb_id: 680, name: 'Pulp Fiction' });
  });

  it('reports the API error and does not call onAdded', async () => {
    stubFetch(mockFetchResponse({ message: 'Could not find movie' }, { ok: false, status: 404 }));
    const onAdded = vi.fn();
    const { result } = renderHookWithProviders(() => useAddMovie({ onAdded }));

    act(() => result.current.mutate({ moviedb_id: 1, name: 'Missing' }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Could not find movie' })),
    );
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('works without options', async () => {
    stubFetch(mockFetchResponse({ message: 'Success' }, { status: 201 }));
    const { result } = renderHookWithProviders(() => useAddMovie());

    act(() => result.current.mutate({ moviedb_id: 2, name: 'Plain' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useAddShow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the TMDB id, refreshes the new show, refreshes the list and calls onAdded', async () => {
    stubFetch(mockFetchResponse({ message: 'Success', tvshow_id: 's1' }, { status: 201 }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onAdded = vi.fn();
    const { result } = renderHookWithProviders(() => useAddShow({ onAdded }), { queryClient });

    act(() => result.current.mutate({ moviedb_id: 1396, name: 'Breaking Bad' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      apiRoutes.tvshow,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ moviedb_id: 1396 }) }),
    );
    expect(mockRefresh).toHaveBeenCalledWith({ tvshowId: 's1', name: 'Breaking Bad' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QueryKey.getShows] });
    expect(onAdded).toHaveBeenCalledWith({ moviedb_id: 1396, name: 'Breaking Bad' });
  });

  it('reports the API error and does not refresh', async () => {
    stubFetch(mockFetchResponse({ message: 'Could not find show' }, { ok: false, status: 404 }));
    const { result } = renderHookWithProviders(() => useAddShow());

    act(() => result.current.mutate({ moviedb_id: 1, name: 'Missing' }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Could not find show' })),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
