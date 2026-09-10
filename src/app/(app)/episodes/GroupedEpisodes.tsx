'use client';

import { SimpleGrid } from '@mantine/core';
import { EpisodeCard } from './EpisodeCard';
import type { ParsedEpisode } from './types';

export type GroupedEpisodesProps = {
  episodes: ParsedEpisode[];
  showDates?: boolean;
  variant?: 'scheduled' | 'snoozed';
};

export const GroupedEpisodes = ({ episodes, showDates, variant = 'scheduled', ...props }: GroupedEpisodesProps) => {
  return (
    <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
      {episodes.map((r) => (
        <EpisodeCard key={r.episodes.id} episode={r} showDate={showDates} variant={variant} {...props} />
      ))}
    </SimpleGrid>
  );
};
