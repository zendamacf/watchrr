'use client';

import { ActionIcon, Alert, Anchor, Badge, Center, Group, Image, Loader, Stack, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft } from 'lucide-react';
import { DateTime } from 'luxon';
import { BackdropCard } from '@/components/BackdropCard';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useMovieQuery } from '@/hooks/useMovie';
import { invalidateStats } from '@/hooks/useStats';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes, routes } from '@/lib/routes';
import { getImageUrl } from '@/lib/themoviedb/images';
import { DateFormat } from '@/utils/dates';
import { formatDuration } from '@/utils/formatDuration';

type Props = {
  movieId: string;
};

export const MovieDetailPage = ({ movieId }: Props) => {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useMovieQuery(movieId);

  const { mutate: markWatched, isPending } = useMutation<unknown, Error>({
    mutationFn: async () => {
      const response = await apiFetch(apiRoutes.movieById(movieId), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: () => {
      showSuccess({ title: 'Nice!', message: `You watched ${data?.movie.name ?? 'this movie'}` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMovie, movieId] });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] });
      invalidateStats(queryClient);
    },
    onError: (err) => showError({ title: 'An error occurred', message: err.message }),
  });

  if (isLoading || (!data && !isError)) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (isError || !data) {
    const notFollowing = error?.message === 'Not found';
    return (
      <Stack gap="md">
        <Alert color={notFollowing ? 'yellow' : 'red'} title={notFollowing ? 'Not following this movie' : 'Error'}>
          {notFollowing
            ? 'Subscribe to this movie from your movies list to open its page.'
            : 'Something went wrong loading this movie.'}
        </Alert>
        <Anchor href={routes.movies}>Back to movies</Anchor>
      </Stack>
    );
  }

  const { movie, subscription, genres } = data;
  const releaseDate = movie.releasedate ? DateTime.fromSQL(movie.releasedate) : null;
  const watchedAt = subscription.watched_at ? DateTime.fromISO(String(subscription.watched_at)) : null;

  return (
    <Stack gap="xl">
      <Anchor href={routes.movies} size="sm">
        <Group gap={4} wrap="nowrap" component="span">
          <ChevronLeft size={16} aria-hidden />
          Back to movies
        </Group>
      </Anchor>

      <BackdropCard backdrop={movie.backdrop_slug} padding="lg">
        <Group align="flex-start" wrap="nowrap" gap="lg">
          <Image
            src={movie.poster_slug ? getImageUrl(movie.poster_slug) : undefined}
            fallbackSrc="/placeholder.jpg"
            alt={`Poster for ${movie.name}`}
            w={{ base: 100, sm: 140 }}
            radius="md"
            style={{ aspectRatio: '2 / 3', objectFit: 'cover', flex: '0 0 auto' }}
          />
          <Stack gap="xs" flex={1}>
            <Title order={2}>{movie.name}</Title>
            <Text size="sm">
              {releaseDate?.toFormat(DateFormat.DMY) ?? 'Unknown release date'}
              {movie.runtime ? ` · ${formatDuration(movie.runtime)}` : ''}
            </Text>
            {movie.description && (
              <Text c="dimmed" size="sm">
                {movie.description}
              </Text>
            )}
            {genres.length > 0 && (
              <Group gap="xs" aria-label="Genres">
                {genres.map((genre) => (
                  <Badge key={genre} variant="light" color="signal">
                    {genre}
                  </Badge>
                ))}
              </Group>
            )}
            <Group gap="xs">
              {subscription.watched ? (
                <Badge color="afterglow" variant="filled">
                  Watched{watchedAt?.isValid ? ` ${watchedAt.toFormat(DateFormat.DMY)}` : ''}
                </Badge>
              ) : (
                <ActionIcon aria-label="Mark watched" loading={isPending} onClick={() => markWatched()}>
                  <Check size={20} />
                </ActionIcon>
              )}
            </Group>
          </Stack>
        </Group>
      </BackdropCard>
    </Stack>
  );
};
