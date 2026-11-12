import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecommendationDetails } from '@/lib/recommendations/types';
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
  similar: [],
};

const extras: RecommendationDetails = {
  tagline: 'Mischief. Mayhem. Soap.',
  genres: ['Drama'],
  rating: 8.4,
  votes: 31_000,
  runtime: 139,
  seasons: null,
  status: 'Released',
  cast: [
    { name: 'Edward Norton', character: 'The Narrator' },
    { name: 'Brad Pitt', character: null },
  ],
  trailer: 'abc123',
  providers: [{ name: 'Netflix', logo: '/netflix.jpg' }],
  providers_link: 'https://www.themoviedb.org/movie/550/watch',
};

/** Serves the movie from our API and its TMDB extras, or fails the extras. */
const stubPage = (movie: MovieDetailResponse = detail, extrasResponse: Response = mockFetchResponse(extras)) =>
  stubFetch(async (input: RequestInfo | URL) =>
    fetchRequestUrl(input).startsWith('/api/recommendations/details') ? extrasResponse : mockFetchResponse(movie),
  );

describe('MovieDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the movie with its genres, runtime and release date', async () => {
    stubPage();
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
    stubPage({ ...detail, genres: [] });
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
    await screen.findByRole('heading', { name: testMovie.name, level: 2 });
    expect(screen.queryByLabelText('Genres')).not.toBeInTheDocument();
  });

  it('shows a watched badge instead of the action for watched movies', async () => {
    stubPage({ ...detail, subscription: { watched: true, watched_at: '2026-11-10T10:00:00.000Z' } });
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
    expect(await screen.findByText(/^Watched/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark watched' })).not.toBeInTheDocument();
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
      if (url.startsWith('/api/recommendations/details')) return mockFetchResponse(extras);
      return mockFetchResponse({ ...detail, subscription: { watched, watched_at: null } });
    });
    const user = userEvent.setup();
    renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);

    await user.click(await screen.findByRole('button', { name: 'Mark watched' }));

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

  describe('TMDB extras', () => {
    it('shows the tagline, rating, cast and where to watch', async () => {
      stubPage();
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);

      expect(await screen.findByText('Mischief. Mayhem. Soap.')).toBeInTheDocument();
      expect(screen.getByText('8.4')).toBeInTheDocument();
      const cast = screen.getByRole('region', { name: 'Cast' });
      expect(cast).toHaveTextContent('Edward Norton');
      expect(cast).toHaveTextContent('The Narrator');
      expect(cast).toHaveTextContent('Brad Pitt');
      const where = screen.getByRole('region', { name: 'Where to watch' });
      expect(where).toHaveTextContent('Netflix');
      expect(screen.getByRole('link', { name: 'JustWatch' })).toHaveAttribute('href', extras.providers_link);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/recommendations/details?type=movie&moviedb_id=${testMovie.moviedb_id}`),
        undefined,
      );
    });

    it('hides where to watch once the movie is watched', async () => {
      stubPage({ ...detail, subscription: { watched: true, watched_at: null } });
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
      await screen.findByText('Mischief. Mayhem. Soap.');
      expect(screen.queryByRole('region', { name: 'Where to watch' })).not.toBeInTheDocument();
    });

    it('omits sections TMDB has nothing for', async () => {
      stubPage(detail, mockFetchResponse({ ...extras, cast: [], providers: [], trailer: null, rating: null }));
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
      await screen.findByText('Mischief. Mayhem. Soap.');
      expect(screen.queryByRole('region', { name: 'Cast' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Where to watch' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Watch trailer' })).not.toBeInTheDocument();
    });

    it('still shows the movie when TMDB fails', async () => {
      stubPage(detail, mockFetchResponse({ message: 'Could not load details from TMDB' }, { ok: false, status: 502 }));
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
      // The details query retries once before giving up.
      expect(
        await screen.findByText(/could not be loaded from TMDB/, undefined, { timeout: 4000 }),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: testMovie.name, level: 2 })).toBeInTheDocument();
    });

    it('plays the trailer in a modal', async () => {
      stubPage();
      const user = userEvent.setup();
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);

      await user.click(await screen.findByRole('button', { name: 'Watch trailer' }));

      const player = await screen.findByTitle(`${testMovie.name} trailer`);
      expect(player).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/abc123'));
    });
  });

  describe('More like this', () => {
    const similar = [
      { moviedb_id: 1001, name: 'Alike One', releasedate: '2019-05-01', poster_slug: '/a.jpg' },
      { moviedb_id: 1002, name: 'Alike Two', releasedate: null, poster_slug: null },
    ];

    it('lists similar movies', async () => {
      stubPage({ ...detail, similar });
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
      const section = await screen.findByRole('region', { name: 'More like this' });
      expect(section).toHaveTextContent('Alike One');
      expect(section).toHaveTextContent('2019');
      expect(section).toHaveTextContent('Alike Two');
    });

    it('omits the section when there are none', async () => {
      stubPage();
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);
      await screen.findByRole('heading', { name: testMovie.name, level: 2 });
      expect(screen.queryByRole('region', { name: 'More like this' })).not.toBeInTheDocument();
    });

    it('follows a similar movie and reloads the page data', async () => {
      let added = false;
      stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = fetchRequestUrl(input);
        if (url === apiRoutes.movie && init?.method === 'POST') {
          added = true;
          return mockFetchResponse({ message: 'Success' });
        }
        if (url.startsWith('/api/recommendations/details')) return mockFetchResponse(extras);
        return mockFetchResponse({ ...detail, similar: added ? [similar[1]] : similar });
      });
      const user = userEvent.setup();
      renderWithProviders(<MovieDetailPage movieId={testMovie.id} />);

      await user.click(await screen.findByRole('button', { name: 'Add Alike One' }));

      await waitFor(() => expect(mockShowSuccess).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nice!' })));
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Add Alike One' })).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Add Alike Two' })).toBeInTheDocument();
    });
  });
});
