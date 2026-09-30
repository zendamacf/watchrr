import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
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

const seasonOneEpisode: ShowEpisodesResponse['episodes'][number] = {
  ...testEpisode,
  watched: false,
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
};

function stubShowDetailFetch(handler?: (url: string, method: string) => Response | undefined) {
  stubFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = fetchRequestUrl(input);
    const method = init?.method?.toLowerCase() ?? 'get';
    const custom = handler?.(url, method);
    if (custom) return custom;

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
  beforeEach(() => {
    vi.clearAllMocks();
    stubShowDetailFetch();
  });

  it('loads and renders show metadata and grouped episodes', async () => {
    renderWithProviders(<ShowDetailPage tvshowId={testShow.id} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: testShow.name, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(testShow.description ?? '')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Season 1', level: 4 })).toBeInTheDocument();
      expect(screen.getByText(/S01E01 — Pilot/)).toBeInTheDocument();
      expect(screen.getByText(/S01E02 — Second/)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(apiRoutes.tvshowEpisodes(testShow.id), { method: 'get' });
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
});
