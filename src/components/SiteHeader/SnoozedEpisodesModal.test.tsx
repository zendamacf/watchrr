import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
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
  it('lists snoozed episodes when open', async () => {
    stubFetch(mockFetchResponse([snoozedEpisode]));
    renderWithProviders(<SnoozedEpisodesModal opened onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /snoozed episode/i })).toBeInTheDocument();
      expect(screen.getByText(testShow.name)).toBeInTheDocument();
    });
  });
});
