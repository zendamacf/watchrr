import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testTmdbTvShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { AddShowModal } from './AddShowModal';

const { mockShowError, mockShowSuccess, mockRefresh } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showInfo: vi.fn(),
    showLoading: vi.fn(),
    doneLoadingSuccess: vi.fn(),
    doneLoadingInfo: vi.fn(),
    doneLoadingError: vi.fn(),
  }),
}));

vi.mock('@/hooks/useRefresh', () => ({
  useRefreshShow: () => ({
    refresh: mockRefresh,
    refreshPending: false,
  }),
}));

describe('AddShowModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubFetch((input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/tvshow/search') && init?.method !== 'POST') {
        return Promise.resolve(mockFetchResponse([testTmdbTvShow]));
      }
      if (url.includes('/api/tvshow') && init?.method === 'POST') {
        return Promise.resolve(
          mockFetchResponse({ message: 'Success', tvshow_id: '00000000-0000-4000-8000-000000000099' }),
        );
      }
      return Promise.resolve(mockFetchResponse({}));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to a show and triggers refresh', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AddShowModal opened onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText('Search'), 'test');
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: testTmdbTvShow.name })).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        apiRoutes.tvshow,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ moviedb_id: testTmdbTvShow.id }),
        }),
      );
      expect(mockRefresh).toHaveBeenCalledWith({
        tvshowId: '00000000-0000-4000-8000-000000000099',
        name: testTmdbTvShow.name,
      });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(testTmdbTvShow.name) }),
      );
    });
  });

  it('shows an error when subscribe fails', async () => {
    stubFetch((input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/tvshow/search')) {
        return Promise.resolve(mockFetchResponse([testTmdbTvShow]));
      }
      if (url.includes('/api/tvshow') && init?.method === 'POST') {
        return Promise.resolve(mockFetchResponse({ message: 'Conflict' }, { ok: false, status: 409 }));
      }
      return Promise.resolve(mockFetchResponse({}));
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AddShowModal opened onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText('Search'), 'test');
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: testTmdbTvShow.name })).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Conflict' }));
    });
  });
});
