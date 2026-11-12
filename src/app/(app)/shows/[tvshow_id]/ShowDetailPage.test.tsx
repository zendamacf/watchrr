import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import type { RecommendationDetails } from '@/lib/recommendations/types';
import { apiRoutes } from '@/lib/routes';
import { fetchRequestUrl, mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import type { EpisodesResponse, ShowEpisodesResponse } from '@/types';
import { ShowDetailPage } from './ShowDetailPage';

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

vi.mock('@mantine/modals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/modals')>();
  return {
    ...actual,
    openConfirmModal: vi.fn(),
  };
});

const seasonOneEpisode: ShowEpisodesResponse['episodes'][number] = {
  ...testEpisode,
  watched: true,
};

const seasonOneEpisodeTwo: ShowEpisodesResponse['episodes'][number] = {
  ...testEpisode,
  id: '00000000-0000-4000-8000-000000000004',
  episode: 2,
  name: 'Second',
  moviedb_id: 63057,
  watched: false,
};

const showDetail: ShowEpisodesResponse = {
  tvshow: testShow,
  subscription: { delay_days: 0, snoozed_until: null },
  episodes: [seasonOneEpisode, seasonOneEpisodeTwo],
  genres: ['Drama', 'Mystery'],
  similar: [],
};

const extras: RecommendationDetails = {
  tagline: 'Winter is coming.',
  genres: ['Drama'],
  rating: 8.5,
  votes: 25_000,
  runtime: null,
  seasons: 2,
  status: 'Returning Series',
  cast: [
    { name: 'Emilia Clarke', character: 'Daenerys', photo: '/emilia.jpg' },
    { name: 'Kit Harington', character: null, photo: null },
  ],
  trailer: 'show123',
  providers: [{ name: 'Max', logo: '/max.jpg' }],
  providers_link: 'https://www.themoviedb.org/tv/1399/watch',
};

const isDetailsRequest = (url: string) => url.startsWith('/api/recommendations/details');

function stubShowDetailFetch(handler?: (url: string, method: string) => Response | undefined) {
  stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = fetchRequestUrl(input);
    const method = init?.method?.toLowerCase() ?? 'get';
    const custom = handler?.(url, method);
    if (custom) return custom;

    if (isDetailsRequest(url)) return mockFetchResponse(extras);

    if (url === apiRoutes.tvshowEpisodes(testShow.id) && method === 'get') {
      return mockFetchResponse(showDetail);
    }
    if (url === apiRoutes.tvshowSeasonWatch(testShow.id, 1) && method === 'put') {
      return mockFetchResponse({ message: 'Success', marked_count: 2 });
    }
    return mockFetchResponse({ message: 'Unexpected request' }, { ok: false, status: 500 });
  });
}

describe('ShowDetailPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    stubShowDetailFetch();
    const { openConfirmModal } = await import('@mantine/modals');
    vi.mocked(openConfirmModal).mockImplementation(({ onConfirm }) => {
      onConfirm?.();
      return 'test-modal-id';
    });
  });

  it('loads and renders show metadata and grouped episodes', async () => {
    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: testShow.name, level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Returning series')).toBeInTheDocument();
      expect(screen.getByText(testShow.description ?? '')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Season 1', level: 4 })).toBeInTheDocument();
      expect(screen.getByText(/S01E01 — Pilot/)).toBeInTheDocument();
      expect(screen.getByText(/S01E02 — Second/)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(apiRoutes.tvshowEpisodes(testShow.id), { method: 'get' });
  });

  it('shows genres, and omits the genre list when there are none', async () => {
    const { unmount } = renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);
    const group = await screen.findByLabelText('Genres');
    expect(group).toHaveTextContent('Drama');
    expect(group).toHaveTextContent('Mystery');
    unmount();

    stubShowDetailFetch((url) =>
      url === apiRoutes.tvshowEpisodes(testShow.id) ? mockFetchResponse({ ...showDetail, genres: [] }) : undefined,
    );
    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);
    await screen.findByRole('heading', { name: testShow.name, level: 2 });
    expect(screen.queryByLabelText('Genres')).not.toBeInTheDocument();
  });

  it('marks a season as watched via the API', async () => {
    let seasonMarked = false;
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = fetchRequestUrl(input);
      const method = init?.method?.toLowerCase() ?? 'get';
      if (url === apiRoutes.tvshowEpisodes(testShow.id) && method === 'get') {
        return mockFetchResponse({
          ...showDetail,
          episodes: showDetail.episodes.map((episode) => ({ ...episode, watched: seasonMarked })),
        });
      }
      if (url === apiRoutes.tvshowSeasonWatch(testShow.id, 1) && method === 'put') {
        seasonMarked = true;
        return mockFetchResponse({ message: 'Success', marked_count: 2 });
      }
      return mockFetchResponse({ message: 'Unexpected request' }, { ok: false, status: 500 });
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShowEpisodes, testShow.id], showDetail);

    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />, { queryClient });

    await waitFor(() => {
      expect(screen.getByLabelText('Mark season 1 as watched')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Mark season 1 as watched'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.tvshowSeasonWatch(testShow.id, 1), { method: 'put' });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(`season 1`) }),
      );
      const cached = queryClient.getQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, testShow.id]);
      expect(cached?.episodes.every((ep) => ep.watched)).toBe(true);
    });
  });

  it('removes matching rows from the schedule cache when marking a season watched', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShowEpisodes, testShow.id], showDetail);
    const schedule: EpisodesResponse = [
      {
        episodes: seasonOneEpisode,
        tvshows: testShow,
        subscription: { delay_days: 0, snoozed_until: null },
      },
    ];
    queryClient.setQueryData([QueryKey.getEpisodes], schedule);

    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />, { queryClient });

    await waitFor(() => expect(screen.getByLabelText('Mark season 1 as watched')).toBeEnabled());
    await user.click(screen.getByLabelText('Mark season 1 as watched'));

    await waitFor(() => {
      expect(queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes])).toEqual([]);
    });
  });

  it('unmarks a watched episode via the API', async () => {
    let pilotUnwatched = false;
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = fetchRequestUrl(input);
      const method = init?.method?.toLowerCase() ?? 'get';
      if (url === apiRoutes.tvshowEpisodes(testShow.id) && method === 'get') {
        return mockFetchResponse({
          ...showDetail,
          episodes: showDetail.episodes.map((ep) =>
            ep.id === seasonOneEpisode.id ? { ...ep, watched: !pilotUnwatched } : ep,
          ),
        });
      }
      if (url === apiRoutes.episodeById(seasonOneEpisode.id) && method === 'delete') {
        pilotUnwatched = true;
        return mockFetchResponse({ message: 'Success' });
      }
      return mockFetchResponse({ message: 'Unexpected request' }, { ok: false, status: 500 });
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShowEpisodes, testShow.id], showDetail);

    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />, { queryClient });

    await waitFor(() => {
      expect(screen.getByLabelText('Unmark S01E01 as watched')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Unmark S01E01 as watched'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.episodeById(seasonOneEpisode.id), { method: 'delete' });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('S01E01') }),
      );
      const cached = queryClient.getQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, testShow.id]);
      expect(cached?.episodes.find((ep) => ep.id === seasonOneEpisode.id)?.watched).toBe(false);
    });

    const { openConfirmModal } = await import('@mantine/modals');
    expect(openConfirmModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unmark as watched?',
        children: expect.anything(),
      }),
    );
  });

  it('shows a not-following message when the show cannot be loaded', async () => {
    stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = fetchRequestUrl(input);
      if (url === apiRoutes.tvshowEpisodes(testShow.id) && (init?.method?.toLowerCase() ?? 'get') === 'get') {
        return mockFetchResponse({ message: 'Not found' }, { ok: false, status: 404 });
      }
      return mockFetchResponse({}, { ok: false, status: 500 });
    });

    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

    await waitFor(() => {
      expect(screen.getByText('Not following this show')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to shows' })).toBeInTheDocument();
    });
  });

  it('shows an error and rolls back when marking a season fails', async () => {
    stubShowDetailFetch((url, method) => {
      if (url === apiRoutes.tvshowSeasonWatch(testShow.id, 1) && method === 'put') {
        return mockFetchResponse({ message: 'Server error' }, { ok: false, status: 500 });
      }
      return undefined;
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShowEpisodes, testShow.id], showDetail);

    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />, { queryClient });

    await waitFor(() => expect(screen.getByLabelText('Mark season 1 as watched')).toBeEnabled());
    await user.click(screen.getByLabelText('Mark season 1 as watched'));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Server error' }));
      const cached = queryClient.getQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, testShow.id]);
      expect(cached?.episodes.some((ep) => !ep.watched)).toBe(true);
    });
  });

  describe('Settings', () => {
    it('keeps the options behind a button in the hero', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);
      await screen.findByRole('heading', { name: testShow.name, level: 2 });
      expect(screen.queryByText('Release delay')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Settings' }));

      expect(await screen.findByText('Release delay')).toBeInTheDocument();
      expect(screen.getByText('Snooze')).toBeInTheDocument();
    });

    it('saves the options and closes the modal', async () => {
      stubShowDetailFetch((url, method) =>
        url === apiRoutes.tvshowPreferences(testShow.id) && method === 'patch'
          ? mockFetchResponse({ delay_days: 7, snoozed_until: null })
          : undefined,
      );
      const user = userEvent.setup();
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

      await user.click(await screen.findByRole('button', { name: 'Settings' }));
      await user.click(await screen.findByLabelText('Enable delay'));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(mockShowSuccess).toHaveBeenCalledWith(expect.objectContaining({ title: 'Saved' })));
      await waitFor(() => expect(screen.queryByText('Release delay')).not.toBeInTheDocument());
    });
  });

  describe('TMDB extras', () => {
    it('shows the tagline, rating, season count, cast and where to watch', async () => {
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

      expect(await screen.findByText('Winter is coming.')).toBeInTheDocument();
      expect(screen.getByText('8.5')).toBeInTheDocument();
      expect(screen.getByText('2 seasons')).toBeInTheDocument();
      const cast = screen.getByRole('region', { name: 'Cast' });
      expect(cast).toHaveTextContent('Emilia Clarke');
      expect(cast).toHaveTextContent('Daenerys');
      expect(cast.querySelector('img')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/emilia.jpg');
      expect(cast).toHaveTextContent('KH');
      expect(screen.getByRole('region', { name: 'Where to watch' })).toHaveTextContent('Max');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/recommendations/details?type=tvshow&moviedb_id=${testShow.moviedb_id}`),
        undefined,
      );
    });

    it('omits sections TMDB has nothing for', async () => {
      stubShowDetailFetch((url) =>
        isDetailsRequest(url)
          ? mockFetchResponse({ ...extras, cast: [], providers: [], trailer: null, rating: null, seasons: null })
          : undefined,
      );
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);
      await screen.findByText('Winter is coming.');
      expect(screen.queryByRole('region', { name: 'Cast' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Where to watch' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Watch trailer' })).not.toBeInTheDocument();
    });

    it('still shows the show and its episodes when TMDB fails', async () => {
      stubShowDetailFetch((url) =>
        isDetailsRequest(url) ? mockFetchResponse({ message: 'nope' }, { ok: false, status: 502 }) : undefined,
      );
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);
      // The details query retries once before giving up.
      expect(
        await screen.findByText(/could not be loaded from TMDB/, undefined, { timeout: 4000 }),
      ).toBeInTheDocument();
      expect(screen.getByText(/S01E01 — Pilot/)).toBeInTheDocument();
    });

    it('plays the trailer in a modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

      await user.click(await screen.findByRole('button', { name: 'Watch trailer' }));

      const player = await screen.findByTitle(`${testShow.name} trailer`);
      expect(player).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/show123'));
    });
  });

  describe('More like this', () => {
    const similar = [
      { moviedb_id: 2001, name: 'Alike Show', description: 'A lookalike', country: 'GB', poster_slug: '/a.jpg' },
      { moviedb_id: 2002, name: 'Other Show', description: null, country: null, poster_slug: null },
    ];

    it('lists similar shows with their country', async () => {
      stubShowDetailFetch((url) =>
        url === apiRoutes.tvshowEpisodes(testShow.id) ? mockFetchResponse({ ...showDetail, similar }) : undefined,
      );
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);
      const section = await screen.findByRole('region', { name: 'More like this' });
      expect(section).toHaveTextContent('Alike Show');
      expect(section).toHaveTextContent('GB');
      expect(section).toHaveTextContent('Other Show');
    });

    it('opens the details modal for a similar show', async () => {
      stubShowDetailFetch((url) =>
        url === apiRoutes.tvshowEpisodes(testShow.id) ? mockFetchResponse({ ...showDetail, similar }) : undefined,
      );
      const user = userEvent.setup();
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

      await user.click(await screen.findByRole('button', { name: 'More about Alike Show' }));

      expect(await screen.findByText('A lookalike')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations/details?type=tvshow&moviedb_id=2001'),
        undefined,
      );
    });

    it('follows a similar show and reloads the page data', async () => {
      let added = false;
      stubShowDetailFetch((url, method) => {
        if (url === apiRoutes.tvshow && method === 'post') {
          added = true;
          return mockFetchResponse({ tvshow_id: 'new-show-id' });
        }
        if (url === apiRoutes.tvshowEpisodes(testShow.id)) {
          return mockFetchResponse({ ...showDetail, similar: added ? [similar[1]] : similar });
        }
        if (url === apiRoutes.tvshowRefresh('new-show-id')) return mockFetchResponse({ message: 'Success' });
        return undefined;
      });
      const user = userEvent.setup();
      renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

      await user.click(await screen.findByRole('button', { name: 'Add Alike Show' }));

      await waitFor(() => expect(screen.queryByRole('button', { name: 'Add Alike Show' })).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Add Other Show' })).toBeInTheDocument();
    });
  });
});
