import { ActionIcon, Button, Group, Image, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { Info, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { useAddMovie } from '@/hooks/useAddMedia';
import { useNotInterested } from '@/hooks/useRecommendations';
import type { DismissalReason, Recommendation, SimilarMovie } from '@/lib/recommendations/types';
import { getImageUrl } from '@/lib/themoviedb/images';
import { RecommendationDetailsModal } from '../../discover/RecommendationDetailsModal';
import { DetailSection } from './MovieExtras';

type Props = {
  /** The page's own movie, so its cached data refreshes after one of these is followed or hidden. */
  movieId: string;
  movies: SimilarMovie[];
};

/** The details modal is shared with Discover, which describes candidates as recommendations. */
const toRecommendation = (movie: SimilarMovie): Recommendation => ({
  type: 'movie',
  ...movie,
  backdrop_slug: null,
  country: null,
  score: 0,
  because: [],
  because_more: 0,
});

/** Movies TMDB suggests alongside this one. Each can be read about, followed or hidden. */
export const SimilarMovies = ({ movieId, movies }: Props) => {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: [QueryKey.getMovie, movieId] });
  const add = useAddMovie({ onAdded: reload });
  const hide = useNotInterested();
  const [selected, setSelected] = useState<Recommendation | null>(null);

  if (movies.length === 0) return null;

  const addMovie = (movie: Pick<SimilarMovie, 'moviedb_id' | 'name'>) =>
    add.mutate({ moviedb_id: movie.moviedb_id, name: movie.name });
  const hideMovie = (target: Recommendation, reason: DismissalReason) =>
    hide.mutate({ ...target, reason }, { onSuccess: reload });

  return (
    <DetailSection title="More like this">
      <Group
        component="ul"
        gap="md"
        align="stretch"
        wrap="nowrap"
        p={0}
        m={0}
        pb="xs"
        style={{ listStyle: 'none', overflowX: 'auto' }}
      >
        {movies.map((movie) => {
          const year = movie.releasedate ? DateTime.fromISO(movie.releasedate).year : null;
          return (
            <Stack component="li" key={movie.moviedb_id} gap="xs" w={140} flex="0 0 auto">
              <Image
                src={movie.poster_slug ? getImageUrl(movie.poster_slug) : undefined}
                fallbackSrc="/placeholder.jpg"
                alt={`Poster for ${movie.name}`}
                radius="md"
                style={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
              />
              <Stack gap={0}>
                <Text size="sm" fw={600} lineClamp={2} title={movie.name}>
                  {movie.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {year ?? ' '}
                </Text>
              </Stack>
              {/* The buttons sit at the bottom of every card, however many lines the title wraps to. */}
              <Group gap={6} wrap="nowrap" mt="auto">
                <ActionIcon
                  variant="default"
                  size={26}
                  aria-label={`More about ${movie.name}`}
                  onClick={() => setSelected(toRecommendation(movie))}
                >
                  <Info size={16} />
                </ActionIcon>
                <Button
                  size="compact-sm"
                  variant="default"
                  flex={1}
                  leftSection={<Plus size={14} aria-hidden />}
                  aria-label={`Add ${movie.name}`}
                  loading={add.isPending && add.variables?.moviedb_id === movie.moviedb_id}
                  onClick={() => addMovie(movie)}
                >
                  Add
                </Button>
              </Group>
            </Stack>
          );
        })}
      </Group>

      <RecommendationDetailsModal
        recommendation={selected}
        onClose={() => setSelected(null)}
        onAdd={addMovie}
        onHide={hideMovie}
      />
    </DetailSection>
  );
};
