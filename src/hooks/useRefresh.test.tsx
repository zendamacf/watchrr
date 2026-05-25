import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testMovie } from '@/test/fixtures/movie';
import { testShow } from '@/test/fixtures/tvshow';
import { renderHookWithProviders } from '@/test/renderHook';
import { useRefreshMovie, useRefreshShow } from './useRefresh';

const { mockShow, mockUpdate } = vi.hoisted(() => ({
  mockShow: vi.fn(() => 'notification-id'),
  mockUpdate: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShow,
    update: mockUpdate,
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
      result.current.refresh({ movieUuid: testMovie.uuid, name: 'Fight Club' });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(apiRoutes.movieRefresh(testMovie.uuid), { method: 'put' });
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
      result.current.refresh({ movieUuid: testMovie.uuid, name: 'Missing' });

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
      result.current.refresh({ tvshowUuid: testShow.uuid, name: 'Breaking Bad' });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(apiRoutes.tvshowRefresh(testShow.uuid), { method: 'put' });
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
      result.current.refresh({ tvshowUuid: testShow.uuid, name: 'Missing Show' });

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
