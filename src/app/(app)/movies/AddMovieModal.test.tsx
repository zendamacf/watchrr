import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testTmdbMovie } from '@/test/fixtures/movie';
import { renderWithProviders } from '@/test/render';
import { AddMovieModal } from './AddMovieModal';

const { mockShowError, mockShowSuccess } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
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

describe('AddMovieModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubFetch((input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/movie/search') && init?.method !== 'POST') {
        return Promise.resolve(mockFetchResponse([testTmdbMovie]));
      }
      if (url.includes('/api/movie') && init?.method === 'POST') {
        return Promise.resolve(mockFetchResponse({ message: 'Success', movie_id: 'new-id' }));
      }
      return Promise.resolve(mockFetchResponse({}));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to a movie from search results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AddMovieModal opened onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText('Search'), 'test');
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: testTmdbMovie.name })).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        apiRoutes.movie,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ moviedb_id: testTmdbMovie.id }),
        }),
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(testTmdbMovie.name) }),
      );
    });
  });

  it('shows an error when subscribe fails', async () => {
    stubFetch((input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/movie/search')) {
        return Promise.resolve(mockFetchResponse([testTmdbMovie]));
      }
      if (url.includes('/api/movie') && init?.method === 'POST') {
        return Promise.resolve(mockFetchResponse({ message: 'Already subscribed' }, { ok: false, status: 409 }));
      }
      return Promise.resolve(mockFetchResponse({}));
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AddMovieModal opened onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText('Search'), 'test');
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: testTmdbMovie.name })).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Already subscribed' }));
    });
  });
});
