'use client';

import { Group } from '@mantine/core';
import { ISOEpisode } from './@types';
import { EpisodeCard } from './EpisodeCard';

export type GroupedEpisodesProps = {
  episodes: ISOEpisode[];
  showDates?: boolean;
  removeEpisode: (episode_id: number) => void;
};

export const GroupedEpisodes = ({ episodes, ...props }: GroupedEpisodesProps) => {
  return (
    <Group wrap={'wrap'} gap={'md'}>
      {episodes.map((r) => (
        <EpisodeCard key={r.episodes.id} episode={r} {...props} />
      ))}
    </Group>
  );
};
