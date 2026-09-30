'use client';

import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Center,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { DateTime } from 'luxon';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useShowEpisodesQuery } from '@/hooks/useShowEpisodes';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes, routes } from '@/lib/routes';
import { getImageUrl } from '@/lib/themoviedb/images';
import type { EpisodesResponse, ShowEpisodesResponse, SubscribedShow } from '@/types';
import { DateFormat } from '@/utils/dates';
import { DELAY_UI_COLOR, isShowSnoozed } from '@/utils/episode-schedule';
import { formatEpisodeNumber } from '@/utils/formatEpisodeNumber';
import { groupEpisodesBySeason } from '../groupEpisodesBySeason';
import { ShowOptionsForm } from '../ShowOptionsForm';
import classes from './ShowDetailPage.module.css';

type Props = {
  tvshowId: string;
};

export const ShowDetailPage = ({ tvshowId }: Props) => {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useShowEpisodesQuery(tvshowId);

  const {
    mutate: markSeasonWatched,
    isPending,
    variables: pendingSeason,
  } = useMutation<
    unknown,
    Error,
    number,
    { previousShowEpisodes: ShowEpisodesResponse | undefined; previousEpisodes: EpisodesResponse | undefined }
  >({
    mutationFn: async (season) => {
      const response = await apiFetch(apiRoutes.tvshowSeasonWatch(tvshowId, season), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (season) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getShowEpisodes, tvshowId] });
      await queryClient.cancelQueries({ queryKey: [QueryKey.getEpisodes] });
      const previousShowEpisodes = queryClient.getQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, tvshowId]);
      const previousEpisodes = queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes]);
      const showName = previousShowEpisodes?.tvshow.name ?? 'Show';

      queryClient.setQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, tvshowId], (old) =>
        old
          ? {
              ...old,
              episodes: old.episodes.map((ep) => (ep.season === season ? { ...ep, watched: true } : ep)),
            }
          : old,
      );
      queryClient.setQueryData<EpisodesResponse>([QueryKey.getEpisodes], (old) =>
        old?.filter((row) => !(row.tvshows.id === tvshowId && row.episodes.season === season)),
      );
      showSuccess({
        title: 'Nice!',
        message: `You watched all of ${showName} season ${season}`,
      });
      return { previousShowEpisodes, previousEpisodes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShowEpisodes, tvshowId] });
    },
    onError: (err, _season, context) => {
      showError({ title: 'An error occurred', message: err.message });
      queryClient.setQueryData([QueryKey.getShowEpisodes, tvshowId], context?.previousShowEpisodes);
      queryClient.setQueryData([QueryKey.getEpisodes], context?.previousEpisodes);
    },
  });

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    const notFollowing = error.message === 'Not found';
    return (
      <Stack gap="md">
        <Alert color={notFollowing ? 'yellow' : 'red'} title={notFollowing ? 'Not following this show' : 'Error'}>
          {notFollowing
            ? 'Subscribe to this show from your shows list to open its page.'
            : 'Something went wrong loading this show.'}
        </Alert>
        <Anchor href={routes.shows}>Back to shows</Anchor>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  const seasons = groupEpisodesBySeason(data.episodes);
  const snoozed = isShowSnoozed(data.subscription.snoozed_until);
  const subscribedShow: SubscribedShow = {
    ...data.tvshow,
    delay_days: data.subscription.delay_days,
    snoozed_until: data.subscription.snoozed_until,
  };

  return (
    <Stack gap="xl">
      <Anchor href={routes.shows} size="sm">
        Back to shows
      </Anchor>

      <Group align="flex-start" wrap="nowrap" gap="lg">
        <Image
          src={data.tvshow.poster_slug ? getImageUrl(data.tvshow.poster_slug) : undefined}
          fallbackSrc="/placeholder.jpg"
          alt={`Poster for ${data.tvshow.name}`}
          w={120}
          mah={180}
          style={{ objectFit: 'contain' }}
        />
        <Stack gap="xs" flex={1}>
          <Title order={2}>{data.tvshow.name}</Title>
          {data.tvshow.description && (
            <Text c="dimmed" size="sm">
              {data.tvshow.description}
            </Text>
          )}
          <Group gap="xs">
            <Badge color="blue" variant="outline">
              {data.tvshow.country}
            </Badge>
            {data.subscription.delay_days > 0 && (
              <Badge color={DELAY_UI_COLOR} variant="outline">
                {data.subscription.delay_days}d delay
              </Badge>
            )}
            {snoozed && data.subscription.snoozed_until && (
              <Badge color="orange" variant="outline">
                Snoozed until {DateTime.fromSQL(data.subscription.snoozed_until).toFormat(DateFormat.DMY)}
              </Badge>
            )}
          </Group>
        </Stack>
      </Group>

      <ShowOptionsForm show={subscribedShow} />

      <Title order={3}>Episodes</Title>

      {seasons.length === 0 ? (
        <Text c="dimmed">No episodes synced yet. Try refreshing metadata from your shows list.</Text>
      ) : (
        <Stack gap="md">
          {seasons.map(([season, episodes]) => {
            const allWatched = episodes.every((ep) => ep.watched);
            const seasonPending = isPending && pendingSeason === season;
            const unwatchedCount = episodes.filter((ep) => !ep.watched).length;

            return (
              <Paper key={season} withBorder shadow="xs" radius="md" className={classes.season}>
                <Group justify="space-between" align="center" wrap="nowrap" className={classes.seasonHeader}>
                  <Group gap="sm" wrap="nowrap">
                    <Title order={4}>Season {season}</Title>
                    <Badge variant="light" color={allWatched ? 'gray' : 'blue'} size="sm">
                      {allWatched ? 'All watched' : `${unwatchedCount} unwatched`}
                    </Badge>
                  </Group>
                  <ActionIcon
                    aria-label={`Mark season ${season} as watched`}
                    loading={seasonPending}
                    disabled={allWatched}
                    onClick={() => markSeasonWatched(season)}
                  >
                    <Check size={20} />
                  </ActionIcon>
                </Group>
                <Stack gap={4} className={classes.seasonEpisodes}>
                  {episodes.map((episode) => (
                    <Group key={episode.id} justify="space-between" wrap="nowrap" className={classes.episodeRow}>
                      <Text size="sm" c={episode.watched ? 'dimmed' : undefined}>
                        {formatEpisodeNumber(episode.season, episode.episode)} — {episode.name}
                      </Text>
                      {episode.watched && (
                        <Text size="xs" c="dimmed">
                          Watched
                        </Text>
                      )}
                    </Group>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};
