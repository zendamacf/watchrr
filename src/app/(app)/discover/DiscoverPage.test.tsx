import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recommendation } from '@/lib/recommendations/types';
import { apiRoutes } from '@/lib/routes';
import { fetchRequestUrl, mockFetchResponse, mockPagedResponse, stubFetch } from '@/test/fetch';
import { testRecommendation, testShowRecommendation } from '@/test/fixtures/recommendation';
import { renderWithProviders } from '@/test/render';
import { DiscoverPage } from './DiscoverPage';

vi.mock('@/hooks/useRefresh', () => ({
  useRefreshShow: () => ({ refresh: vi.fn(), refreshPending: false }),
}));

const calls = () => vi.mocked(fetch).mock.calls.map(([input, init]) => ({ url: fetchRequestUrl(input), init }));
const searchParams = (url: string) => new URL(url, 'http://localhost').searchParams;

/** Answers list requests like the API does: only rows of the requested type, paged by limit and offset. */
function serve(rows: Recommendation[], onWrite?: (init: RequestInit) => Response) {
  stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'POST' && onWrite) return onWrite(init);
    const params = searchParams(fetchRequestUrl(input));
    const matching = rows.filter((r) => r.type === params.get('type'));
    const offset = Number(params.get('offset') ?? 0);
    const limit = Number(params.get('limit') ?? 100);
    return mockPagedResponse(matching.slice(offset, offset + limit), matching.length);
  });
}

const movieRows = (count: number): Recommendation[] =>
  Array.from({ length: count }, (_, i) => ({ ...testRecommendation, moviedb_id: 1000 + i, name: `Movie ${i}` }));

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton cards while loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    renderWithProviders(<DiscoverPage />);
    expect(screen.queryAllByTestId('media-skeleton').length).toBeGreaterThan(0);
  });

  it('shows one empty state when there is nothing to recommend', async () => {
    serve([]);
    renderWithProviders(<DiscoverPage />);
    expect(await screen.findByText('Nothing to recommend yet')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Shows' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Movies' })).not.toBeInTheDocument();
  });

  it('shows an error in each section when requests fail', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<DiscoverPage />);
    expect(await screen.findByText('Could not load shows')).toBeInTheDocument();
    expect(screen.getByText('Could not load movies')).toBeInTheDocument();
  });

  it('keeps a working section visible when the other one fails', async () => {
    stubFetch(async (input: RequestInfo | URL) =>
      searchParams(fetchRequestUrl(input)).get('type') === 'movie'
        ? mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 })
        : mockPagedResponse([testShowRecommendation]),
    );
    renderWithProviders(<DiscoverPage />);

    expect(await screen.findByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
    expect(screen.getByText('Could not load movies')).toBeInTheDocument();
  });

  it('puts shows and movies in their own sections, shows first', async () => {
    serve([testRecommendation, testShowRecommendation]);
    renderWithProviders(<DiscoverPage />);

    await screen.findByRole('heading', { name: 'Pulp Fiction' });
    const showsSection = screen.getByRole('region', { name: /Shows/ });
    const moviesSection = screen.getByRole('region', { name: /Movies/ });

    expect(within(showsSection).getByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
    expect(within(showsSection).queryByRole('heading', { name: 'Pulp Fiction' })).not.toBeInTheDocument();
    expect(within(moviesSection).getByRole('heading', { name: 'Pulp Fiction' })).toBeInTheDocument();
    expect(within(showsSection).getByText('The Wire')).toBeInTheDocument();
    expect(within(moviesSection).getByText('Fight Club')).toBeInTheDocument();
    expect(showsSection.compareDocumentPosition(moviesSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('requests six of each type to start with', async () => {
    serve([testRecommendation, testShowRecommendation]);
    renderWithProviders(<DiscoverPage />);
    await screen.findByRole('heading', { name: 'Pulp Fiction' });

    const requests = calls().map((c) => searchParams(c.url));
    expect(requests.map((p) => p.get('type')).sort()).toEqual(['movie', 'tvshow']);
    expect(requests.every((p) => p.get('limit') === '6' && p.get('offset') === '0')).toBe(true);
  });

  it('hides a section that has nothing to suggest', async () => {
    serve([testRecommendation]);
    renderWithProviders(<DiscoverPage />);

    expect(await screen.findByRole('heading', { name: 'Pulp Fiction' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Movies/ })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Shows/ })).not.toBeInTheDocument();
  });

  it('shows how many suggestions each section has', async () => {
    serve(movieRows(8));
    renderWithProviders(<DiscoverPage />);

    await screen.findByRole('heading', { name: 'Movie 0' });
    const section = screen.getByRole('region', { name: /Movies/ });
    expect(within(section).getByText('8')).toBeInTheDocument();
  });

  it('loads more of one section without touching the other', async () => {
    const user = userEvent.setup();
    serve([...movieRows(8), testShowRecommendation]);
    renderWithProviders(<DiscoverPage />);

    await screen.findByRole('heading', { name: 'Movie 0' });
    const movies = screen.getByRole('region', { name: /Movies/ });
    expect(within(movies).getAllByRole('heading', { level: 3 })).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'Show more shows' })).not.toBeInTheDocument();

    await user.click(within(movies).getByRole('button', { name: 'Show more movies' }));

    await waitFor(() => expect(within(movies).getAllByRole('heading', { level: 3 })).toHaveLength(8));
    expect(within(movies).queryByRole('button', { name: 'Show more movies' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Breaking Bad' })).toHaveLength(1);
  });

  it('adds a movie and removes its card', async () => {
    const user = userEvent.setup();
    serve([testRecommendation, testShowRecommendation], () =>
      mockFetchResponse({ message: 'Success', movie_id: 'm1' }, { status: 201 }),
    );
    renderWithProviders(<DiscoverPage />);

    await user.click(await screen.findByRole('button', { name: 'Add Pulp Fiction' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Pulp Fiction' })).not.toBeInTheDocument();
    });
    const post = calls().find((c) => c.init?.method === 'POST');
    expect(post?.url).toBe(apiRoutes.movie);
    expect(JSON.parse(String(post?.init?.body))).toEqual({ moviedb_id: 680 });
    expect(screen.getByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
  });

  it('adds a show and removes its card', async () => {
    const user = userEvent.setup();
    serve([testRecommendation, testShowRecommendation], () =>
      mockFetchResponse({ message: 'Success', tvshow_id: 's1' }, { status: 201 }),
    );
    renderWithProviders(<DiscoverPage />);

    await user.click(await screen.findByRole('button', { name: 'Add Breaking Bad' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Breaking Bad' })).not.toBeInTheDocument();
    });
    expect(calls().find((c) => c.init?.method === 'POST')?.url).toBe(apiRoutes.tvshow);
  });

  it('keeps the card when adding fails', async () => {
    const user = userEvent.setup();
    serve([testRecommendation], () =>
      mockFetchResponse({ message: 'Could not find movie' }, { ok: false, status: 404 }),
    );
    renderWithProviders(<DiscoverPage />);

    await user.click(await screen.findByRole('button', { name: 'Add Pulp Fiction' }));

    await waitFor(() => {
      expect(calls().some((c) => c.init?.method === 'POST')).toBe(true);
    });
    expect(screen.getByRole('heading', { name: 'Pulp Fiction' })).toBeInTheDocument();
  });

  it('hides a recommendation with "not interested"', async () => {
    const user = userEvent.setup();
    let hidden = false;
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        hidden = true;
        return mockFetchResponse({ message: 'Success' }, { status: 201 });
      }
      // Like the server, stop returning the item once it is hidden.
      const type = searchParams(fetchRequestUrl(input)).get('type');
      const rows = [testRecommendation, testShowRecommendation].filter(
        (r) => r.type === type && !(hidden && r === testRecommendation),
      );
      return mockPagedResponse(rows);
    });
    renderWithProviders(<DiscoverPage />);

    await user.click(await screen.findByRole('button', { name: 'Not interested in Pulp Fiction' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Pulp Fiction' })).not.toBeInTheDocument();
    });
    const post = calls().find((c) => c.init?.method === 'POST');
    expect(post?.url).toBe(apiRoutes.notInterested);
    expect(JSON.parse(String(post?.init?.body))).toEqual({ type: 'movie', moviedb_id: 680 });
    expect(screen.getByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
  });
});
