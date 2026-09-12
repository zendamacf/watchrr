import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import type { EpisodesResponse } from '@/types';
import { SnoozedIndicator } from './SnoozedIndicator';

const snoozedEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, id: '00000000-0000-4000-8000-000000000091' },
  tvshows: testShow,
  subscription: { delay_days: 0, snoozed_until: '2099-12-01' },
};

describe('SnoozedIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a badge with the snoozed episode count', async () => {
    stubFetch(mockFetchResponse([snoozedEpisode, snoozedEpisode]));
    renderWithProviders(<SnoozedIndicator />);

    await waitFor(() => {
      expect(screen.getByLabelText('2 snoozed episodes')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('opens a modal listing snoozed episodes when clicked', async () => {
    stubFetch(mockFetchResponse([snoozedEpisode]));
    const user = userEvent.setup();
    renderWithProviders(<SnoozedIndicator />);

    await waitFor(() => {
      expect(screen.getByLabelText('1 snoozed episode')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('1 snoozed episode'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Show')).toBeInTheDocument();
    expect(screen.getByText(/S01E01/)).toBeInTheDocument();
    expect(screen.getByText(/Snoozed until/)).toBeInTheDocument();
  });

  it('renders nothing when there are no snoozed episodes', async () => {
    stubFetch(mockFetchResponse([]));
    renderWithProviders(<SnoozedIndicator />);

    await waitFor(() => {
      expect(screen.queryByLabelText(/snoozed/i)).not.toBeInTheDocument();
    });
  });
});
