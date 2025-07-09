'use client';

import { Group } from '@mantine/core';
import { ParsedEpisode } from './@types';
import { EpisodeCard } from './EpisodeCard';

export type GroupedEpisodesProps = {
  episodes: ParsedEpisode[];
  showDates?: boolean;
  onRemove: () => void;
};

export const GroupedEpisodes = ({ episodes, showDates, ...props }: GroupedEpisodesProps) => {
  return (
    <Group wrap={'wrap'} gap={'md'}>
      {episodes.map((r) => (
        <EpisodeCard key={r.episodes.id} episode={r} showDate={showDates} {...props} />
      ))}
    </Group>
  );
};
