'use client';

import { ActionIcon, Divider, Group, Modal, type ModalProps, ScrollArea, Stack, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { DateTime } from 'luxon';
import { Fragment } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useSnoozedEpisodes } from '@/hooks/useEpisodes';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse } from '@/types';
import { DateFormat } from '@/utils/dates';

type Props = Pick<ModalProps, 'opened' | 'onClose'>;

type EpisodeRow = EpisodesResponse[number];

type MutationContext = { previousEpisodes: EpisodesResponse | undefined };

function formatEpisodeNumber(season: number, episode: number) {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
}

function SnoozedEpisodeRow({ episode }: { episode: EpisodeRow }) {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();
  const episodeNumber = formatEpisodeNumber(episode.episodes.season, episode.episodes.episode);

  const { mutate: markWatched, isPending: watchPending } = useMutation<unknown, Error, string, MutationContext>({
    mutationFn: async (episodeId) => {
      const response = await apiFetch(apiRoutes.episodeById(episodeId), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (episodeId) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getEpisodes] });
      const previousEpisodes = queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes]);
      queryClient.setQueryData<EpisodesResponse>([QueryKey.getEpisodes], (old) =>
        old?.filter((row) => row.episodes.id !== episodeId),
      );
      showSuccess({
        title: 'Nice!',
        message: `You watched ${episode.tvshows.name} ${episodeNumber}`,
      });
      return { previousEpisodes };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] }),
    onError(error, _vars, context) {
      showError({ title: 'An error occurred', message: error.message });
      queryClient.setQueryData([QueryKey.getEpisodes], context?.previousEpisodes);
    },
  });

  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
      <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
        <Text fw={600} lineClamp={1}>
          {episode.tvshows.name}
        </Text>
        <Text size="sm" lineClamp={1}>
          {episodeNumber} · {episode.episodes.name}
        </Text>
        {episode.subscription.snoozed_until && (
          <Text size="xs" c="dimmed">
            Snoozed until {DateTime.fromSQL(episode.subscription.snoozed_until).toFormat(DateFormat.DMY)}
          </Text>
        )}
      </Stack>
      <ActionIcon
        aria-label={`Mark ${episode.tvshows.name} ${episodeNumber} as watched`}
        loading={watchPending}
        onClick={() => markWatched(episode.episodes.id)}
      >
        <Check size={18} />
      </ActionIcon>
    </Group>
  );
}

export const SnoozedEpisodesModal = ({ opened, onClose }: Props) => {
  const { episodes } = useSnoozedEpisodes();
  const title = episodes.length === 1 ? '1 snoozed episode' : `${episodes.length} snoozed episodes`;

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <ScrollArea.Autosize mah="60vh" type="auto">
        <Stack gap="sm">
          {episodes.map((episode, index) => (
            <Fragment key={episode.episodes.id}>
              {index > 0 && <Divider />}
              <SnoozedEpisodeRow episode={episode} />
            </Fragment>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  );
};
