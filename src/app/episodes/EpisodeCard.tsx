'use client';

import { FormattedDate } from '@/components/Dates';
import { ActionIcon, Card, Group, Stack, Text, Title } from '@mantine/core';
import classNames from 'classnames';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { ISOEpisode } from './@types';
import classes from './EpisodeCard.module.css';

type Props = {
  episode: ISOEpisode;
  showDate?: boolean;
  removeEpisode: (episode_id: number) => void;
};

export const EpisodeCard = ({ episode, showDate, removeEpisode }: Props) => {
  const [loading, setLoading] = useState(false);

  async function markWatched(episode_id: number) {
    setLoading(true);
    const response = await fetch(`/api/episode/${episode_id}/`, { method: 'put' });
    if (response.ok) {
      await removeEpisode(episode_id);
    }
    // TODO: Display error
    setLoading(false);
  }

  return (
    <Card key={episode.episodes.id} w={400} withBorder>
      <Title order={3} lineClamp={1}>
        {episode.tvshows.name}
      </Title>
      <Group justify={'space-between'} align={'flex-end'}>
        <Stack gap={0}>
          <Text
            fw={'bold'}
          >{`S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`}</Text>
          <Text>{episode.episodes.name}</Text>
          {showDate && (
            <Text className={classNames({ [classes.pastdate!]: episode.episodes.in_past })}>
              <FormattedDate iso={episode.episodes.local_date} />
            </Text>
          )}
        </Stack>
        <ActionIcon
          loaderProps={{ type: 'dots' }}
          loading={loading}
          onClick={() => markWatched(episode.episodes.id)}
        >
          <Check />
        </ActionIcon>
      </Group>
    </Card>
  );
};
