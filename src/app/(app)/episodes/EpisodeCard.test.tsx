import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import type { EpisodesResponse } from '@/types';
import { EpisodeCard } from './EpisodeCard';
import type { ParsedEpisode } from './types';

const { mockShowError, mockShowSuccess, mockShowInfo } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
  mockShowInfo: vi.fn(),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showInfo: mockShowInfo,
    showLoading: vi.fn(),
    doneLoadingSuccess: vi.fn(),
    doneLoadingInfo: vi.fn(),
    doneLoadingError: vi.fn(),
  }),
}));

const parsedEpisode: ParsedEpisode = {
  episodes: {
    ...testEpisode,
    local_date: DateTime.fromSQL('2030-06-01'),
    in_past: false,
  },
  tvshows: testShow,
};

describe('EpisodeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ message: 'Success' }));
  });

  it('marks an episode as watched via the API', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const episodes: EpisodesResponse = [parsedEpisode];
    queryClient.setQueryData([QueryKey.getEpisodes], episodes);
    renderWithProviders(<EpisodeCard episode={parsedEpisode} showDate />, { queryClient });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.episodeById(testEpisode.id), { method: 'put' });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(testShow.name) }),
      );
    });
  });

  it('shows an error and rolls back the cache when the API fails', async () => {
    stubFetch(mockFetchResponse({ message: 'Server error' }, { ok: false, status: 500 }));
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const episodes: EpisodesResponse = [parsedEpisode];
    queryClient.setQueryData([QueryKey.getEpisodes], episodes);
    renderWithProviders(<EpisodeCard episode={parsedEpisode} />, { queryClient });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Server error' }));
      expect(queryClient.getQueryData([QueryKey.getEpisodes])).toEqual(episodes);
    });
  });

  it('copies episode label and shows info notification', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EpisodeCard episode={parsedEpisode} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]!);

    expect(mockShowInfo).toHaveBeenCalledWith(expect.objectContaining({ message: 'Copied' }));
  });
});
