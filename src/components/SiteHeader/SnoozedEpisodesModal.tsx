'use client';

import { ActionIcon, Divider, Group, Modal, type ModalProps, ScrollArea, Stack, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { DateTime } from 'luxon';
import { Fragment } from 'react';
import { InfiniteScrollSentinel } from '@/components/InfiniteScroll';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useSnoozedEpisodeCount, useSnoozedEpisodes } from '@/hooks/useEpisodes';
import { apiFetch } from '@/lib/api/fetch';
import { restorePaged, snapshotPaged, updatePaged } from '@/lib/query/paged';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse } from '@/types';
import { DateFormat } from '@/utils/dates';
import { formatEpisodeNumber } from '@/utils/formatEpisodeNumber';

type Props = Pick<ModalProps, 'opened' | 'onClose'>;

type EpisodeRow = EpisodesResponse[number];

type MutationContext = { previousEpisodes: ReturnType<typeof snapshotPaged> };

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
      const previousEpisodes = snapshotPaged(queryClient, QueryKey.getEpisodes);
      updatePaged<EpisodeRow>(queryClient, QueryKey.getEpisodes, (rows) =>
        rows.filter((row) => row.episodes.id !== episodeId),
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
      restorePaged(queryClient, context?.previousEpisodes);
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
  // Only load the full list once the modal is opened; the title uses the cheap shared count.
  const { episodes, hasNextPage, isFetchingNextPage, fetchNextPage } = useSnoozedEpisodes({ enabled: opened });
  const total = useSnoozedEpisodeCount();
  const title = total === 1 ? '1 snoozed episode' : `${total} snoozed episodes`;

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <ScrollArea.Autosize mah="60vh" type="auto">
        {!episodes.length && (
          <Text c="dimmed" ta="center" py="lg">
            Nothing is snoozed. Snooze a show from its page to pause its episodes.
          </Text>
        )}
        <Stack gap="sm">
          {episodes.map((episode, index) => (
            <Fragment key={episode.episodes.id}>
              {index > 0 && <Divider />}
              <SnoozedEpisodeRow episode={episode} />
            </Fragment>
          ))}
        </Stack>
        <InfiniteScrollSentinel
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          loadedCount={episodes.length}
        />
      </ScrollArea.Autosize>
    </Modal>
  );
};
