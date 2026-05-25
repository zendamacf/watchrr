import { screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { PastEpisodes } from './PastEpisodes';
import type { ParsedEpisode } from './types';

vi.mock('./GroupedEpisodes', () => ({
  GroupedEpisodes: () => <div data-testid="grouped-episodes" />,
}));

const parsedEpisode: ParsedEpisode = {
  episodes: {
    ...testEpisode,
    local_date: DateTime.fromSQL('2020-01-01'),
    in_past: true,
  },
  tvshows: testShow,
};

describe('PastEpisodes', () => {
  it('shows past episode count in the accordion control', () => {
    renderWithProviders(<PastEpisodes episodes={[parsedEpisode, parsedEpisode]} />);
    expect(screen.getByText('2 Past Episodes')).toBeInTheDocument();
  });
});
