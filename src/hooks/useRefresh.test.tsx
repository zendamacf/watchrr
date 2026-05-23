import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderHookWithProviders } from '@/test/renderHook';
import { useRefreshMovie, useRefreshShow } from './useRefresh';

const mockShow = vi.fn(() => 'notification-id');
const mockUpdate = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockShow(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

describe('useRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShow.mockReturnValue('notification-id');
    stubFetch(mockFetchResponse({ message: 'Success' }));
  });

  describe('useRefreshMovie', () => {
    it('calls the movie refresh API and shows success notification', async () => {
      const { result } = renderHookWithProviders(() => useRefreshMovie());
      result.current.refresh({ movieId: 42, name: 'Fight Club' });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(apiRoutes.movieRefresh(42), { method: 'put' });
      });
      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith(
          expect.objectContaining({
            loading: true,
            message: expect.objectContaining({}),
          }),
        );
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'notification-id',
            color: 'green',
            loading: false,
          }),
        );
      });
    });

    it('updates the loading notification on API error', async () => {
      stubFetch(mockFetchResponse({ message: 'Could not find movie' }, { ok: false, status: 404 }));
      const { result } = renderHookWithProviders(() => useRefreshMovie());
      result.current.refresh({ movieId: 99, name: 'Missing' });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'notification-id',
            color: 'red',
            loading: false,
          }),
        );
      });
    });
  });

  describe('useRefreshShow', () => {
    it('calls the tvshow refresh API and shows success notification', async () => {
      const { result } = renderHookWithProviders(() => useRefreshShow());
      result.current.refresh({ tvshowId: 7, name: 'Breaking Bad' });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(apiRoutes.tvshowRefresh(7), { method: 'put' });
      });
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'notification-id',
            color: 'green',
          }),
        );
      });
    });

    it('updates the loading notification on API error', async () => {
      stubFetch(mockFetchResponse({ message: 'Could not find show' }, { ok: false, status: 404 }));
      const { result } = renderHookWithProviders(() => useRefreshShow());
      result.current.refresh({ tvshowId: 99, name: 'Missing Show' });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'notification-id',
            color: 'red',
          }),
        );
      });
    });
  });
});
