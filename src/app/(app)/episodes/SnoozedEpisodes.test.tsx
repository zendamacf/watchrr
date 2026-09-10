import { screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import { testEpisode } from '@/test/fixtures/episode';
import { testSubscription } from '@/test/fixtures/subscription';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { SnoozedEpisodes } from './SnoozedEpisodes';
import type { ParsedEpisode } from './types';

vi.mock('./GroupedEpisodes', () => ({
  GroupedEpisodes: () => <div data-testid="grouped-episodes" />,
}));

const parsedEpisode: ParsedEpisode = {
  episodes: {
    ...testEpisode,
    local_date: DateTime.fromSQL('2020-01-01'),
    original_local_date: DateTime.fromSQL('2020-01-01'),
    in_past: true,
    is_snoozed: true,
    delay_days: 0,
    snoozed_until: '2099-12-01',
  },
  tvshows: testShow,
  subscription: { ...testSubscription, snoozed_until: '2099-12-01' },
};

describe('SnoozedEpisodes', () => {
  it('shows snoozed episode count in the accordion control', () => {
    renderWithProviders(<SnoozedEpisodes episodes={[parsedEpisode, parsedEpisode]} />);
    expect(screen.getByText('2 Snoozed Episodes')).toBeInTheDocument();
  });

  it('uses singular copy for one snoozed episode', () => {
    renderWithProviders(<SnoozedEpisodes episodes={[parsedEpisode]} />);
    expect(screen.getByText('1 Snoozed Episode')).toBeInTheDocument();
  });
});
