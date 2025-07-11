'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { useAlert } from '@/hooks/useAlert';
import { DateFormat } from '@/utils/dates';
import { ActionIcon, Group, Stack, Text, Title } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import classNames from 'classnames';
import { Check } from 'lucide-react';
import classes from './EpisodeCard.module.css';
import { ParsedEpisode } from './types';

type Props = {
  episode: ParsedEpisode;
  showDate?: boolean;
  onRemove: (episode_id: number) => void;
};

export const EpisodeCard = ({ episode, showDate, onRemove }: Props) => {
  const { showError, showSuccess } = useAlert();

  const episodeNumber = `S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`;

  const { mutate, isPending } = useMutation<unknown, Error, number>({
    mutationFn: async (episode_id) => {
      const response = await fetch(`/api/episode/${episode_id}/`, { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, episode_id) => {
      onRemove(episode_id);
      showSuccess('Nice!', `You watched ${episode.tvshows.name} ${episodeNumber}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  return (
    <BackdropCard key={episode.episodes.id} w={400} backdrop={episode.tvshows.backdrop_slug}>
      <Title order={3} lineClamp={1}>
        {episode.tvshows.name}
      </Title>
      <Group justify={'space-between'} align={'flex-end'}>
        <Stack gap={0}>
          <Text fw={'bold'}>{episodeNumber}</Text>
          <Text>{episode.episodes.name}</Text>
          {showDate && (
            <Text className={classNames({ [classes.pastdate!]: episode.episodes.in_past })}>
              {episode.episodes.local_date.toFormat(DateFormat.DOW_DMY)}
            </Text>
          )}
        </Stack>
        <ActionIcon
          loaderProps={{ type: 'dots' }}
          loading={isPending}
          onClick={() => mutate(episode.episodes.id)}
        >
          <Check />
        </ActionIcon>
      </Group>
    </BackdropCard>
  );
};
