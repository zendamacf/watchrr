import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testSubscription } from '@/test/fixtures/subscription';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import type { EpisodesResponse } from '@/types';
import { EpisodeList } from './EpisodeList';

vi.mock('./PastEpisodes', () => ({
  PastEpisodes: ({ episodes }: { episodes: unknown[] }) => (
    <div data-testid="past-episodes">{episodes.length} past</div>
  ),
}));

vi.mock('./GroupedEpisodes', () => ({
  GroupedEpisodes: () => <div data-testid="grouped-episodes" />,
}));

const futureEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, airdate: '2099-12-01', name: 'Future Pilot' },
  tvshows: { ...testShow, name: 'Future Show', country: 'US' },
  subscription: testSubscription,
};

const pastEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, id: '00000000-0000-4000-8000-000000000090', airdate: '2020-01-01', name: 'Old Pilot' },
  tvshows: { ...testShow, name: 'Past Show', country: 'US' },
  subscription: testSubscription,
};

const snoozedEpisode: EpisodesResponse[number] = {
  episodes: {
    ...testEpisode,
    id: '00000000-0000-4000-8000-000000000091',
    airdate: '2020-01-01',
    name: 'Snoozed Pilot',
  },
  tvshows: { ...testShow, name: 'Snoozed Show', country: 'US' },
  subscription: { delay_days: 0, snoozed_until: '2099-12-01' },
};

describe('EpisodeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loader while episodes are loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    const { container } = renderWithProviders(<EpisodeList />);
    expect(container.querySelector('.mantine-Loader-root')).toBeTruthy();
  });

  it('shows an error when the episodes request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<EpisodeList />);
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('treats delayed episodes as future when the effective date has not passed', async () => {
    const delayedPastAirdate: EpisodesResponse[number] = {
      episodes: {
        ...testEpisode,
        id: '00000000-0000-4000-8000-000000000092',
        airdate: '2026-09-01',
        name: 'Delayed Pilot',
      },
      tvshows: { ...testShow, name: 'Delayed Show', country: 'US' },
      subscription: { delay_days: 14, snoozed_until: null },
    };

    stubFetch(mockFetchResponse([delayedPastAirdate]));
    renderWithProviders(<EpisodeList />);

    await waitFor(() => {
      expect(screen.queryByTestId('past-episodes')).not.toBeInTheDocument();
      expect(screen.getByTestId('grouped-episodes')).toBeInTheDocument();
    });
  });

  it('excludes snoozed episodes from the main schedule', async () => {
    stubFetch(mockFetchResponse([snoozedEpisode, futureEpisode]));
    renderWithProviders(<EpisodeList />);

    await waitFor(() => {
      expect(screen.queryByTestId('past-episodes')).not.toBeInTheDocument();
      expect(screen.getByTestId('grouped-episodes')).toBeInTheDocument();
      expect(screen.queryByText(/snoozed/i)).not.toBeInTheDocument();
    });
  });

  it('orders future date sections by effective airdate when delay shifts schedule', async () => {
    const delayedEpisode: EpisodesResponse[number] = {
      episodes: {
        ...testEpisode,
        id: '00000000-0000-4000-8000-000000000093',
        airdate: '2099-09-01',
        name: 'Delayed Pilot',
      },
      tvshows: { ...testShow, name: 'Delayed Show', country: 'US' },
      subscription: { delay_days: 14, snoozed_until: null },
    };
    const normalEpisode: EpisodesResponse[number] = {
      episodes: {
        ...testEpisode,
        id: '00000000-0000-4000-8000-000000000094',
        airdate: '2099-09-10',
        name: 'Normal Pilot',
      },
      tvshows: { ...testShow, name: 'Normal Show', country: 'US' },
      subscription: { delay_days: 0, snoozed_until: null },
    };

    stubFetch(mockFetchResponse([delayedEpisode, normalEpisode]));
    renderWithProviders(<EpisodeList />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('10/09/2099');
      expect(headings[1]).toHaveTextContent('15/09/2099');
    });
  });

  it('groups past and future episodes and filters by search', async () => {
    stubFetch(mockFetchResponse([pastEpisode, futureEpisode]));
    const user = userEvent.setup();
    renderWithProviders(<EpisodeList />);

    await waitFor(() => {
      expect(screen.getByTestId('past-episodes')).toHaveTextContent('1 past');
      expect(screen.getByTestId('grouped-episodes')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search'), 'future');
    await waitFor(() => {
      expect(screen.queryByTestId('past-episodes')).not.toBeInTheDocument();
      expect(screen.getByTestId('grouped-episodes')).toBeInTheDocument();
    });
  });
});
