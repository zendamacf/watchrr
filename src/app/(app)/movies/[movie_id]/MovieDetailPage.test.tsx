import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { fetchRequestUrl, mockFetchResponse, stubFetch } from '@/test/fetch';
import { testMovie } from '@/test/fixtures/movie';
import { renderWithProviders } from '@/test/render';
import type { MovieDetailResponse } from '@/types';
import { MovieDetailPage } from './MovieDetailPage';

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

const detail: MovieDetailResponse = {
  movie: testMovie,
  subscription: { watched: false, watched_at: null },
  genres: ['Drama', 'Thriller'],
};

describe('MovieDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the movie with its genres, runtime and release date', async () => {
    stubFetch(mockFetchResponse(detail));
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);

    expect(await screen.findByRole('heading', { name: testMovie.name, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(testMovie.description ?? '')).toBeInTheDocument();
    expect(screen.getByText(/2h 0m/)).toBeInTheDocument();
    const genres = screen.getByLabelText('Genres');
    expect(genres).toHaveTextContent('Drama');
    expect(genres).toHaveTextContent('Thriller');
    expect(fetch).toHaveBeenCalledWith(apiRoutes.movieById(testMovie.id), { method: 'get' });
  });

  it('omits genres when none are stored yet', async () => {
    stubFetch(mockFetchResponse({ ...detail, genres: [] }));
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
    await screen.findByRole('heading', { name: testMovie.name, level: 2 });
    expect(screen.queryByLabelText('Genres')).not.toBeInTheDocument();
  });

  it('shows a watched badge instead of the action for watched movies', async () => {
    stubFetch(
      mockFetchResponse({ ...detail, subscription: { watched: true, watched_at: '2026-11-10T10:00:00.000Z' } }),
    );
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
    expect(await screen.findByText(/^Watched/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Mark watched')).not.toBeInTheDocument();
  });

  it('marks the movie as watched', async () => {
    let watched = false;
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = fetchRequestUrl(input);
      const method = init?.method?.toLowerCase() ?? 'get';
      if (url === apiRoutes.movieById(testMovie.id) && method === 'put') {
        watched = true;
        return mockFetchResponse({ message: 'Success' });
      }
      return mockFetchResponse({ ...detail, subscription: { watched, watched_at: null } });
    });
    const user = userEvent.setup();
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);

    await user.click(await screen.findByLabelText('Mark watched'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.movieById(testMovie.id), { method: 'put' });
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nice!' }));
    });
    expect(await screen.findByText(/^Watched/)).toBeInTheDocument();
  });

  it('explains when the user is not following the movie', async () => {
    stubFetch(mockFetchResponse({ message: 'Not found' }, { ok: false, status: 404 }));
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
    expect(await screen.findByText('Not following this movie')).toBeInTheDocument();
  });
});
