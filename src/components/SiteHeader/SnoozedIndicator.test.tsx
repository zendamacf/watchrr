import { screen, waitFor } from '@testing-library/react';
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

  it('shows no badge when there are no snoozed episodes', async () => {
    stubFetch(mockFetchResponse([]));
    renderWithProviders(<SnoozedIndicator />);

    await waitFor(() => {
      expect(screen.getByLabelText('0 snoozed episodes')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
