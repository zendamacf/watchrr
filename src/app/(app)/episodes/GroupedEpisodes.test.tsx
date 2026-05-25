import { screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { GroupedEpisodes } from './GroupedEpisodes';
import type { ParsedEpisode } from './types';

vi.mock('./EpisodeCard', () => ({
  EpisodeCard: ({ episode }: { episode: ParsedEpisode }) => (
    <div data-testid="episode-card">{episode.episodes.name}</div>
  ),
}));

const parsedEpisode: ParsedEpisode = {
  episodes: {
    ...testEpisode,
    local_date: DateTime.fromSQL('2030-06-01'),
    in_past: false,
  },
  tvshows: testShow,
};

describe('GroupedEpisodes', () => {
  it('renders an episode card for each entry', () => {
    renderWithProviders(<GroupedEpisodes episodes={[parsedEpisode]} showDates />);
    expect(screen.getByTestId('episode-card')).toHaveTextContent('Pilot');
  });
});
