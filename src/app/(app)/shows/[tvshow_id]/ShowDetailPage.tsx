'use client';

import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, Play, Settings, Undo2 } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { SimilarTitles } from '@/components/SimilarTitles';
import { Cast, ExtrasSkeleton, WhereToWatch } from '@/components/TitleExtras';
import { RatingBadge, TitleHero } from '@/components/TitleHero';
import { TrailerModal } from '@/components/TrailerModal';
import { useAlert } from '@/hooks/useAlert';
import { useRecommendationDetails } from '@/hooks/useRecommendationDetails';
import { useShowEpisodesQuery } from '@/hooks/useShowEpisodes';
import { invalidateStats } from '@/hooks/useStats';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes, routes } from '@/lib/routes';
import type { EpisodesResponse, ShowEpisode, ShowEpisodesResponse, SubscribedShow } from '@/types';
import { DateFormat } from '@/utils/dates';
import { DELAY_UI_COLOR, isShowSnoozed } from '@/utils/episode-schedule';
import { formatEpisodeNumber } from '@/utils/formatEpisodeNumber';
import { formatTvShowStatusLabel, tvShowStatusBadgeColor } from '@/utils/tvshowStatus';
import { groupEpisodesBySeason } from '../groupEpisodesBySeason';
import { ShowOptionsForm } from '../ShowOptionsForm';
import classes from './ShowDetailPage.module.css';
import { ShowStats } from './ShowStats';

type Props = {
  tvshowId: string;
};

export const ShowDetailPage = ({ tvshowId }: Props) => {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useShowEpisodesQuery(tvshowId);
  // Cast, trailer and streaming come from TMDB, so they load after the page itself.
  const extras = useRecommendationDetails(data ? { type: 'tvshow', moviedb_id: data.tvshow.moviedb_id } : null);
  const details = extras.data;
  const [trailer, setTrailer] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      invalidateStats(queryClient);
    },
    onError: (err, _season, context) => {
      showError({ title: 'An error occurred', message: err.message });
      queryClient.setQueryData([QueryKey.getShowEpisodes, tvshowId], context?.previousShowEpisodes);
      queryClient.setQueryData([QueryKey.getEpisodes], context?.previousEpisodes);
    },
  });

  type EpisodeMutationContext = {
    previousShowEpisodes: ShowEpisodesResponse | undefined;
    previousEpisodes: EpisodesResponse | undefined;
  };

  const {
    mutate: unwatchEpisode,
    isPending: unwatchPending,
    variables: unwatchEpisodeId,
  } = useMutation<unknown, Error, ShowEpisode, EpisodeMutationContext>({
    mutationFn: async (episode) => {
      const response = await apiFetch(apiRoutes.episodeById(episode.id), { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (episode) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getShowEpisodes, tvshowId] });
      await queryClient.cancelQueries({ queryKey: [QueryKey.getEpisodes] });
      const previousShowEpisodes = queryClient.getQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, tvshowId]);
      const previousEpisodes = queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes]);
      const showName = previousShowEpisodes?.tvshow.name ?? 'Show';
      const episodeNumber = formatEpisodeNumber(episode.season, episode.episode);

      queryClient.setQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, tvshowId], (old) =>
        old
          ? {
              ...old,
              episodes: old.episodes.map((row) => (row.id === episode.id ? { ...row, watched: false } : row)),
            }
          : old,
      );

      showSuccess({
        title: 'Undone',
        message: `Unmarked ${showName} ${episodeNumber} as watched`,
      });
      return { previousShowEpisodes, previousEpisodes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShowEpisodes, tvshowId] });
      invalidateStats(queryClient);
    },
    onError: (err, _episode, context) => {
      showError({ title: 'An error occurred', message: err.message });
      queryClient.setQueryData([QueryKey.getShowEpisodes, tvshowId], context?.previousShowEpisodes);
      queryClient.setQueryData([QueryKey.getEpisodes], context?.previousEpisodes);
    },
  });

  const confirmUnwatchEpisode = (episode: ShowEpisode) => {
    const episodeNumber = formatEpisodeNumber(episode.season, episode.episode);
    openConfirmModal({
      title: 'Unmark as watched?',
      children: (
        <Text size="sm">
          Remove watched status for {episodeNumber} — {episode.name}?
        </Text>
      ),
      labels: { confirm: 'Unmark', cancel: 'Cancel' },
      centered: true,
      onConfirm: () => unwatchEpisode(episode),
    });
  };

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
  const showStreaming = (details?.providers.length ?? 0) > 0;
  const subscribedShow: SubscribedShow = {
    ...data.tvshow,
    delay_days: data.subscription.delay_days,
    snoozed_until: data.subscription.snoozed_until,
  };

  return (
    <Stack gap="xl">
      <Anchor href={routes.shows} size="sm">
        <Group gap={4} wrap="nowrap" component="span">
          <ChevronLeft size={16} aria-hidden />
          Back to shows
        </Group>
      </Anchor>

      <TitleHero
        name={data.tvshow.name}
        poster={data.tvshow.poster_slug}
        backdrop={data.tvshow.backdrop_slug}
        tagline={details?.tagline}
        meta={
          <>
            {data.tvshow.status ? (
              <Badge color={tvShowStatusBadgeColor(data.tvshow.status)} variant="filled">
                {formatTvShowStatusLabel(data.tvshow.status)}
              </Badge>
            ) : null}
            {data.tvshow.country && <Text size="sm">{data.tvshow.country}</Text>}
            {details?.seasons ? (
              <Text size="sm">
                {details.seasons} {details.seasons === 1 ? 'season' : 'seasons'}
              </Text>
            ) : null}
            <RatingBadge rating={details?.rating} />
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
          </>
        }
        actions={
          <>
            {details?.trailer && (
              <Button
                variant="white"
                color="dark"
                leftSection={<Play size={16} aria-hidden />}
                onClick={() => setTrailer(details.trailer)}
              >
                Watch trailer
              </Button>
            )}
            <Button
              variant="filled"
              color="dark"
              leftSection={<Settings size={16} aria-hidden />}
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </Button>
          </>
        }
      >
        {data.genres.length > 0 && (
          <Group gap="xs" aria-label="Genres">
            {data.genres.map((genre) => (
              <Badge key={genre} variant="light" color="signal">
                {genre}
              </Badge>
            ))}
          </Group>
        )}
      </TitleHero>

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: showStreaming ? 8 : 12 }}>
          <Stack gap="md" maw="75ch">
            {data.tvshow.description && <Text size="lg">{data.tvshow.description}</Text>}
            {extras.isLoading && <ExtrasSkeleton />}
            {extras.isError && (
              <Text size="sm" c="dimmed">
                Cast, trailer and streaming details could not be loaded from TMDB.
              </Text>
            )}
          </Stack>
        </Grid.Col>
        {details && showStreaming && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <WhereToWatch details={details} />
          </Grid.Col>
        )}
      </Grid>

      {details && <Cast details={details} />}

      <ShowStats tvshowId={tvshowId} />

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
              <Paper key={season} withBorder className={classes.season}>
                <Group justify="space-between" align="center" wrap="nowrap" className={classes.seasonHeader}>
                  <Group gap="sm" wrap="nowrap">
                    <Title order={4}>Season {season}</Title>
                    <Badge variant="light" color={allWatched ? 'afterglow' : 'signal'} size="sm">
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
                    <Group
                      key={episode.id}
                      justify="space-between"
                      wrap="nowrap"
                      className={`${classes.episodeRow}${episode.watched ? ` ${classes.episodeRowWatched}` : ''}`}
                    >
                      <Group gap="xs" wrap="nowrap">
                        {episode.watched && <Check size={14} aria-hidden className={classes.watchedTick} />}
                        <Text size="sm" c={episode.watched ? 'dimmed' : undefined}>
                          {formatEpisodeNumber(episode.season, episode.episode)} — {episode.name}
                        </Text>
                      </Group>
                      {episode.watched ? (
                        <ActionIcon
                          className={classes.unwatchAction}
                          aria-label={`Unmark ${formatEpisodeNumber(episode.season, episode.episode)} as watched`}
                          variant="subtle"
                          size="sm"
                          loading={unwatchPending && unwatchEpisodeId?.id === episode.id}
                          onClick={() => confirmUnwatchEpisode(episode)}
                        >
                          <Undo2 size={16} />
                        </ActionIcon>
                      ) : null}
                    </Group>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <SimilarTitles
        type="tvshow"
        titles={data.similar}
        onChanged={() => queryClient.invalidateQueries({ queryKey: [QueryKey.getShowEpisodes, tvshowId] })}
      />

      <Modal opened={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" centered>
        <ShowOptionsForm embedded show={subscribedShow} onSaved={() => setSettingsOpen(false)} />
      </Modal>

      <TrailerModal videoKey={trailer} title={data.tvshow.name} onClose={() => setTrailer(null)} />
    </Stack>
  );
};
