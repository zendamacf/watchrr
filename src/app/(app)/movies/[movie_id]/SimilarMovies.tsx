import { Button, Group, Image, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { QueryKey } from '@/components/QueryProvider';
import { useAddMovie } from '@/hooks/useAddMedia';
import type { SimilarMovie } from '@/lib/recommendations/types';
import { getImageUrl } from '@/lib/themoviedb/images';
import { DetailSection } from './MovieExtras';

type Props = {
  /** The page's own movie, so its cached data refreshes after one of these is followed. */
  movieId: string;
  movies: SimilarMovie[];
};

/** Movies TMDB suggests alongside this one, each with a button to start following it. */
export const SimilarMovies = ({ movieId, movies }: Props) => {
  const queryClient = useQueryClient();
  const add = useAddMovie({
    onAdded: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getMovie, movieId] }),
  });

  if (movies.length === 0) return null;

  return (
    <DetailSection title="More like this">
      <Group
        component="ul"
        gap="md"
        align="flex-start"
        wrap="nowrap"
        p={0}
        m={0}
        pb="xs"
        style={{ listStyle: 'none', overflowX: 'auto' }}
      >
        {movies.map((movie) => {
          const year = movie.releasedate ? DateTime.fromISO(movie.releasedate).year : null;
          return (
            <Stack component="li" key={movie.moviedb_id} gap="xs" w={128} flex="0 0 auto">
              <Image
                src={movie.poster_slug ? getImageUrl(movie.poster_slug) : undefined}
                fallbackSrc="/placeholder.jpg"
                alt={`Poster for ${movie.name}`}
                radius="md"
                style={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
              />
              <Stack gap={0}>
                <Text size="sm" fw={600} lineClamp={2}>
                  {movie.name}
                </Text>
                {year && (
                  <Text size="xs" c="dimmed">
                    {year}
                  </Text>
                )}
              </Stack>
              <Button
                size="compact-sm"
                variant="default"
                leftSection={<Plus size={14} aria-hidden />}
                aria-label={`Add ${movie.name}`}
                loading={add.isPending && add.variables?.moviedb_id === movie.moviedb_id}
                onClick={() => add.mutate({ moviedb_id: movie.moviedb_id, name: movie.name })}
              >
                Add
              </Button>
            </Stack>
          );
        })}
      </Group>
    </DetailSection>
  );
};
