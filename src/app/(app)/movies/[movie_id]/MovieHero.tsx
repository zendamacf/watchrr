import { Badge, Button, Group, Image, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { Check, Play, Star } from 'lucide-react';
import { DateTime } from 'luxon';
import type { CSSProperties } from 'react';
import type { RecommendationDetails } from '@/lib/recommendations/types';
import { getImageUrl } from '@/lib/themoviedb/images';
import type { MovieDetailResponse } from '@/types';
import { DateFormat } from '@/utils/dates';
import { formatDuration } from '@/utils/formatDuration';
import classes from './MovieHero.module.css';

type Props = {
  data: MovieDetailResponse;
  /** TMDB extras. Undefined while they load or if they could not be loaded. */
  details: RecommendationDetails | undefined;
  onPlayTrailer: () => void;
  onMarkWatched: () => void;
  markingWatched: boolean;
};

/** Backdrop, poster, title and the actions: mark watched and play the trailer. */
export const MovieHero = ({ data, details, onPlayTrailer, onMarkWatched, markingWatched }: Props) => {
  const { movie, subscription, genres } = data;
  const releaseDate = movie.releasedate ? DateTime.fromSQL(movie.releasedate) : null;
  const watchedAt = subscription.watched_at ? DateTime.fromISO(String(subscription.watched_at)) : null;
  const tagline = details?.tagline;

  return (
    <header
      className={classes.root}
      style={
        {
          '--image-url': movie.backdrop_slug ? `url(${getImageUrl(movie.backdrop_slug, 'w1280')})` : undefined,
        } as CSSProperties
      }
    >
      <Group align="flex-end" wrap="nowrap" gap="lg" w="100%">
        <Image
          className={classes.poster}
          src={movie.poster_slug ? getImageUrl(movie.poster_slug) : undefined}
          fallbackSrc="/placeholder.jpg"
          alt={`Poster for ${movie.name}`}
          w={{ base: 96, xs: 120, sm: 190 }}
          radius="md"
        />
        <Stack gap="sm" flex={1} miw={0}>
          <Stack gap={4}>
            <Title order={2} className={classes.title}>
              {movie.name}
            </Title>
            {tagline && (
              <Text fs="italic" c="dimmed">
                {tagline}
              </Text>
            )}
          </Stack>

          <Group gap="md" align="center">
            <Text size="sm">{releaseDate?.toFormat(DateFormat.DMY) ?? 'Unknown release date'}</Text>
            {movie.runtime ? <Text size="sm">{formatDuration(movie.runtime)}</Text> : null}
            {details?.rating != null && (
              <Badge variant="light" color="yellow" leftSection={<Star size={12} aria-hidden />}>
                <VisuallyHidden>TMDB rating </VisuallyHidden>
                {details.rating.toFixed(1)}
                <VisuallyHidden> out of 10</VisuallyHidden>
              </Badge>
            )}
          </Group>

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
            {details?.trailer && (
              <Button variant="white" color="dark" leftSection={<Play size={16} aria-hidden />} onClick={onPlayTrailer}>
                Watch trailer
              </Button>
            )}
            {subscription.watched ? (
              <Badge size="lg" color="afterglow" variant="filled">
                Watched{watchedAt?.isValid ? ` ${watchedAt.toFormat(DateFormat.DMY)}` : ''}
              </Badge>
            ) : (
              <Button
                variant="filled"
                loading={markingWatched}
                leftSection={<Check size={16} aria-hidden />}
                onClick={onMarkWatched}
              >
                Mark watched
              </Button>
            )}
          </Group>
        </Stack>
      </Group>
    </header>
  );
};
