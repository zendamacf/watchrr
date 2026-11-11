import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShowStats as ShowStatsData } from '@/lib/stats/types';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { ShowStats } from './ShowStats';

const stats: ShowStatsData = {
  seasons: [
    { season: 1, watched: 2, aired: 2, total: 2 },
    { season: 2, watched: 0, aired: 3, total: 4 },
  ],
  watched: 2,
  aired: 5,
  backlog: 3,
  backlogMinutes: 150,
  startedAt: '2026-10-01T10:00:00.000+00:00',
  lastWatchedAt: '2026-10-15T10:00:00.000+00:00',
  episodesPerWeek: 1,
  nextAirDate: '2027-03-01',
};

describe('ShowStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    renderWithProviders(<ShowStats tvshowId="show-1" />);
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
  });

  it('renders nothing when the request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'Not found' }, { ok: false, status: 404 }));
    renderWithProviders(<ShowStats tvshowId="show-1" />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
  });

  it('renders progress, backlog, dates and pace', async () => {
    stubFetch(mockFetchResponse(stats));
    renderWithProviders(<ShowStats tvshowId="show-1" />);

    expect(await screen.findByText('2 / 5 aired')).toBeInTheDocument();
    expect(screen.getByText('3 episodes')).toBeInTheDocument();
    expect(screen.getByText('2h 30m')).toBeInTheDocument();
    expect(screen.getByText('1 episodes / week')).toBeInTheDocument();
    expect(screen.getByText('Season 1')).toBeInTheDocument();
    expect(screen.getByText('0 / 3 aired')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Season 2 progress' })).toBeInTheDocument();
  });

  it('shows placeholders when there is no history or runtime data', async () => {
    stubFetch(
      mockFetchResponse({
        ...stats,
        seasons: [{ season: 1, watched: 0, aired: 0, total: 1 }],
        watched: 0,
        aired: 0,
        backlog: 0,
        backlogMinutes: null,
        startedAt: null,
        lastWatchedAt: null,
        episodesPerWeek: null,
        nextAirDate: null,
      }),
    );
    renderWithProviders(<ShowStats tvshowId="show-1" />);

    expect(await screen.findByText('Caught up')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
  });

  it('says the backlog time is unknown when no runtimes are stored', async () => {
    stubFetch(mockFetchResponse({ ...stats, backlogMinutes: null }));
    renderWithProviders(<ShowStats tvshowId="show-1" />);
    expect(await screen.findByText('Unknown')).toBeInTheDocument();
  });
});
