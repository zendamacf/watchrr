import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OverallStats } from '@/lib/stats/types';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { StatsPage } from './StatsPage';

// Recharts needs real layout, which happy-dom lacks.
vi.mock('@mantine/charts', () => ({
  BarChart: ({ data, dataKey }: { data: Record<string, unknown>[]; dataKey: string }) => (
    <div data-testid="bar-chart">{data.map((row) => String(row[dataKey])).join(',')}</div>
  ),
}));

const counts = { total: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, unknownDate: 0 };

const stats: OverallStats = {
  range: { from: '2026-09-01', to: '2026-11-11' },
  timezone: 'UTC',
  episodes: { total: 42, thisWeek: 3, thisMonth: 10, thisYear: 40, unknownDate: 2 },
  movies: { ...counts, total: 5, thisYear: 5 },
  watchMinutes: 2 * 60 + 5,
  missingRuntimeCount: 1,
  activity: [{ weekStart: '2026-11-09', episodes: 3, movies: 0 }],
  weekdays: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, count: i })),
  shows: { watching: 2, caughtUp: 1, snoozed: 0, ended: 3 },
  backlog: 7,
  streaks: { current: 1, longest: 4 },
};

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loader while loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    renderWithProviders(<StatsPage />);
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
  });

  it('shows an error when the request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<StatsPage />);
    expect(await screen.findByText('An error occurred')).toBeInTheDocument();
  });

  it('shows an empty state for a user with no history', async () => {
    stubFetch(
      mockFetchResponse({
        ...stats,
        episodes: counts,
        movies: counts,
        shows: { watching: 0, caughtUp: 0, snoozed: 0, ended: 0 },
      }),
    );
    renderWithProviders(<StatsPage />);
    expect(await screen.findByText('No stats yet')).toBeInTheDocument();
  });

  it('renders totals, watch time, backlog, streaks and charts', async () => {
    stubFetch(mockFetchResponse(stats));
    renderWithProviders(<StatsPage />);

    expect(await screen.findByText('Episodes watched')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/3 this week · 10 this month · 40 this year/)).toBeInTheDocument();
    expect(screen.getByText('2 with unknown date')).toBeInTheDocument();
    expect(screen.getByText('2h 5m')).toBeInTheDocument();
    expect(screen.getByText('Excludes 1 item without a runtime yet')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1 day')).toBeInTheDocument();
    expect(screen.getByText('Longest: 4 days')).toBeInTheDocument();
    expect(screen.getByText('2 watching')).toBeInTheDocument();
    expect(screen.getByText('3 ended')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
  });

  it('hides the missing-runtime note when every runtime is known', async () => {
    stubFetch(mockFetchResponse({ ...stats, missingRuntimeCount: 0 }));
    renderWithProviders(<StatsPage />);
    await screen.findByText('Episodes watched');
    expect(screen.queryByText(/without a runtime/)).not.toBeInTheDocument();
  });
});
