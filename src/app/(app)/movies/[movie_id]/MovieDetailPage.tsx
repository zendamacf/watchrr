'use client';

import { Alert, Anchor, Center, Grid, Group, Loader, Stack, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useMovieQuery } from '@/hooks/useMovie';
import { useRecommendationDetails } from '@/hooks/useRecommendationDetails';
import { invalidateStats } from '@/hooks/useStats';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes, routes } from '@/lib/routes';
import { Cast, ExtrasSkeleton, WhereToWatch } from './MovieExtras';
import { MovieHero } from './MovieHero';
import { SimilarMovies } from './SimilarMovies';
import { TrailerModal } from './TrailerModal';

type Props = {
  movieId: string;
};

export const MovieDetailPage = ({ movieId }: Props) => {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useMovieQuery(movieId);
  // Cast, trailer and streaming come from TMDB, so they load after the page itself.
  const extras = useRecommendationDetails(data ? { type: 'movie', moviedb_id: data.movie.moviedb_id } : null);
  const details = extras.data;
  const [trailer, setTrailer] = useState<string | null>(null);

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

  const { movie, similar } = data;
  const showStreaming = !data.subscription.watched && (details?.providers.length ?? 0) > 0;

  return (
    <Stack gap="xl">
      <Anchor href={routes.movies} size="sm">
        <Group gap={4} wrap="nowrap" component="span">
          <ChevronLeft size={16} aria-hidden />
          Back to movies
        </Group>
      </Anchor>

      <MovieHero
        data={data}
        details={details}
        onPlayTrailer={() => setTrailer(details?.trailer ?? null)}
        onMarkWatched={() => markWatched()}
        markingWatched={isPending}
      />

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: showStreaming ? 8 : 12 }}>
          <Stack gap="md" maw="75ch">
            {movie.description && <Text size="lg">{movie.description}</Text>}
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

      <SimilarMovies movieId={movieId} movies={similar} />

      <TrailerModal videoKey={trailer} title={movie.name} onClose={() => setTrailer(null)} />
    </Stack>
  );
};
