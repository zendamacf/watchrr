'use client';

import { MediaGrid } from '@/components/MediaGrid';
import { EpisodeCard } from './EpisodeCard';
import type { ParsedEpisode } from './types';

export type GroupedEpisodesProps = {
  episodes: ParsedEpisode[];
  showDates?: boolean;
  variant?: 'scheduled' | 'snoozed';
};

export const GroupedEpisodes = ({ episodes, showDates, variant = 'scheduled', ...props }: GroupedEpisodesProps) => {
  return (
    <MediaGrid>
      {episodes.map((r) => (
        <EpisodeCard key={r.episodes.id} episode={r} showDate={showDates} variant={variant} {...props} />
      ))}
    </MediaGrid>
  );
};
