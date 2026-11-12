import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { fetchRequestUrl, mockFetchResponse, mockPagedResponse, stubFetch } from '@/test/fetch';
import { testRecommendation, testShowRecommendation } from '@/test/fixtures/recommendation';
import { renderWithProviders } from '@/test/render';
import { DiscoverPage } from './DiscoverPage';

vi.mock('@/hooks/useRefresh', () => ({
  useRefreshShow: () => ({ refresh: vi.fn(), refreshPending: false }),
}));

const calls = () => vi.mocked(fetch).mock.calls.map(([input, init]) => ({ url: fetchRequestUrl(input), init }));

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton cards while loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    renderWithProviders(<DiscoverPage />);
    expect(screen.queryByTestId('media-skeleton')).toBeTruthy();
  });

  it('shows an empty state when there is nothing to recommend', async () => {
    stubFetch(mockPagedResponse([]));
    renderWithProviders(<DiscoverPage />);
    expect(await screen.findByText('Nothing to recommend yet')).toBeInTheDocument();
  });

  it('shows an error when the request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<DiscoverPage />);
    expect(await screen.findByText('An error occurred')).toBeInTheDocument();
  });

  it('renders movie and show recommendations with their source', async () => {
    stubFetch(mockPagedResponse([testRecommendation, testShowRecommendation]));
    renderWithProviders(<DiscoverPage />);

    expect(await screen.findByRole('heading', { name: 'Pulp Fiction' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
    expect(screen.getByText('Because you watch Fight Club')).toBeInTheDocument();
    expect(screen.getByText('Because you watch The Wire')).toBeInTheDocument();
  });

  it('requests only the chosen type when filtering', async () => {
    const user = userEvent.setup();
    stubFetch(mockPagedResponse([testRecommendation]));
    renderWithProviders(<DiscoverPage />);
    await screen.findByRole('heading', { name: 'Pulp Fiction' });

    await user.click(screen.getByLabelText('Filter recommendations by type'));
    await user.click(await screen.findByRole('option', { name: 'Shows', hidden: true }));

    await waitFor(() => {
      expect(calls().some((c) => c.url.includes(apiRoutes.recommendations()) && c.url.includes('type=tvshow'))).toBe(
        true,
      );
    });
  });

  it('adds a movie and removes its card', async () => {
    const user = userEvent.setup();
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return mockFetchResponse({ message: 'Success', movie_id: 'm1' }, { status: 201 });
      return fetchRequestUrl(input).includes('/api/recommendations')
        ? mockPagedResponse([testRecommendation, testShowRecommendation])
        : mockFetchResponse({});
    });
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
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return mockFetchResponse({ message: 'Success', tvshow_id: 's1' }, { status: 201 });
      return fetchRequestUrl(input).includes('/api/recommendations')
        ? mockPagedResponse([testRecommendation, testShowRecommendation])
        : mockFetchResponse({});
    });
    renderWithProviders(<DiscoverPage />);

    await user.click(await screen.findByRole('button', { name: 'Add Breaking Bad' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Breaking Bad' })).not.toBeInTheDocument();
    });
    expect(calls().find((c) => c.init?.method === 'POST')?.url).toBe(apiRoutes.tvshow);
  });

  it('keeps the card when adding fails', async () => {
    const user = userEvent.setup();
    stubFetch(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'POST'
        ? mockFetchResponse({ message: 'Could not find movie' }, { ok: false, status: 404 })
        : mockPagedResponse([testRecommendation]),
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
    stubFetch(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        hidden = true;
        return mockFetchResponse({ message: 'Success' }, { status: 201 });
      }
      // Like the server, stop returning the item once it is hidden.
      return mockPagedResponse(hidden ? [testShowRecommendation] : [testRecommendation, testShowRecommendation]);
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
