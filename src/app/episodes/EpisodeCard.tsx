'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { useAlert } from '@/hooks/useAlert';
import { DateFormat } from '@/utils/dates';
import { ActionIcon, CopyButton, Group, Stack, Text, Title } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import classNames from 'classnames';
import { Check, ClipboardCheck, Copy } from 'lucide-react';
import classes from './EpisodeCard.module.css';
import { ParsedEpisode } from './types';

type Props = {
  episode: ParsedEpisode;
  showDate?: boolean;
  onRemove: (episode_id: number) => void;
};

export const EpisodeCard = ({ episode, showDate, onRemove }: Props) => {
  const { showError, showSuccess, showInfo } = useAlert();

  const episodeNumber = `S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`;

  const { mutate, isPending } = useMutation<unknown, Error, number>({
    mutationFn: async (episode_id) => {
      const response = await fetch(`/api/episode/${episode_id}/`, { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, episode_id) => {
      onRemove(episode_id);
      showSuccess({
        title: 'Nice!',
        message: `You watched ${episode.tvshows.name} ${episodeNumber}`,
      });
    },
    onError(error) {
      showError({ title: 'An error occurred', message: error.message });
    },
  });

  return (
    <BackdropCard
      key={episode.episodes.id}
      style={{ width: '100%' }}
      backdrop={episode.tvshows.backdrop_slug}
    >
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
        <Group justify={'end'} gap={'xs'}>
          <CopyButton value={`${episode.tvshows.name} ${episodeNumber}`} timeout={2000}>
            {({ copied, copy }) => (
              <ActionIcon
                variant={'outline'}
                color={copied ? 'blue' : 'grey'}
                onClick={() => {
                  copy();
                  showInfo({ message: 'Copied', icon: <ClipboardCheck /> });
                }}
              >
                {copied ? <ClipboardCheck size={'20'} /> : <Copy size={'20'} />}
              </ActionIcon>
            )}
          </CopyButton>
          <ActionIcon loading={isPending} onClick={() => mutate(episode.episodes.id)}>
            <Check size={'20'} />
          </ActionIcon>
        </Group>
      </Group>
    </BackdropCard>
  );
};
