'use client';

import { ActionIcon, CopyButton, Group, Stack, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import classNames from 'classnames';
import { Check, ClipboardCheck, Copy } from 'lucide-react';
import { BackdropCard } from '@/components/BackdropCard';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse } from '@/types';
import { DateFormat } from '@/utils/dates';
import classes from './EpisodeCard.module.css';
import type { ParsedEpisode } from './types';

type Props = {
  episode: ParsedEpisode;
  showDate?: boolean;
};

type MutationContext = { previousEpisodes: EpisodesResponse | undefined };

export const EpisodeCard = ({ episode, showDate }: Props) => {
  const { showError, showSuccess, showInfo } = useAlert();

  const episodeNumber = `S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`;

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation<unknown, Error, string, MutationContext>({
    mutationFn: async (episodeId) => {
      const response = await fetch(apiRoutes.episodeById(episodeId), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (episodeId) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getEpisodes] });
      const previousEpisodes = queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes]);
      queryClient.setQueryData<EpisodesResponse>([QueryKey.getEpisodes], (old) =>
        old?.filter((o) => o.episodes.id !== episodeId),
      );
      showSuccess({
        title: 'Nice!',
        message: `You watched ${episode.tvshows.name} ${episodeNumber}`,
      });
      return { previousEpisodes }; // Context for rollback
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] }),
    onError(error, _vars, context) {
      showError({ title: 'An error occurred', message: error.message });
      // Revert optimistic update
      queryClient.setQueryData([QueryKey.getEpisodes], context?.previousEpisodes);
    },
  });

  return (
    <BackdropCard key={episode.episodes.id} style={{ width: '100%' }} backdrop={episode.tvshows.backdrop_slug}>
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
