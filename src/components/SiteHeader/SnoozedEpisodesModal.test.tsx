import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, mockPagedResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import type { EpisodesResponse } from '@/types';
import { SnoozedEpisodesModal } from './SnoozedEpisodesModal';

const snoozedEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, id: '00000000-0000-4000-8000-000000000092' },
  tvshows: testShow,
  subscription: { delay_days: 0, snoozed_until: '2099-12-01' },
};

describe('SnoozedEpisodesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists snoozed episodes when open', async () => {
    stubFetch(mockPagedResponse([snoozedEpisode]));
    renderWithProviders(<SnoozedEpisodesModal opened onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /snoozed episode/i })).toBeInTheDocument();
      expect(screen.getByText(testShow.name)).toBeInTheDocument();
    });
  });

  it('marks a snoozed episode as watched', async () => {
    const user = userEvent.setup();
    const episodeId = snoozedEpisode.episodes.id;
    stubFetch(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'put' ? mockFetchResponse({ message: 'Success' }) : mockPagedResponse([snoozedEpisode]),
    );

    renderWithProviders(<SnoozedEpisodesModal opened onClose={() => undefined} />);

    const markButton = await screen.findByRole('button', {
      name: `Mark ${testShow.name} S01E01 as watched`,
    });
    await user.click(markButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.episodeById(episodeId), expect.objectContaining({ method: 'put' }));
    });
  });

  it('does not load the episode list until opened, and counts with a single-row request', async () => {
    stubFetch(mockPagedResponse([snoozedEpisode], 3));
    renderWithProviders(<SnoozedEpisodesModal opened={false} onClose={() => undefined} />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('snoozed=true');
    expect(urls[0]).toContain('limit=1');
  });
});
