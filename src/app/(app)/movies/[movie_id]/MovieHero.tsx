import { Badge, Button, Group, Text } from '@mantine/core';
import { Check, Play } from 'lucide-react';
import { DateTime } from 'luxon';
import { RatingBadge, TitleHero } from '@/components/TitleHero';
import type { RecommendationDetails } from '@/lib/recommendations/types';
import type { MovieDetailResponse } from '@/types';
import { DateFormat } from '@/utils/dates';
import { formatDuration } from '@/utils/formatDuration';

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

  return (
    <TitleHero
      name={movie.name}
      poster={movie.poster_slug}
      backdrop={movie.backdrop_slug}
      tagline={details?.tagline}
      meta={
        <>
          <Text size="sm">{releaseDate?.toFormat(DateFormat.DMY) ?? 'Unknown release date'}</Text>
          {movie.runtime ? <Text size="sm">{formatDuration(movie.runtime)}</Text> : null}
          <RatingBadge rating={details?.rating} />
        </>
      }
      actions={
        <>
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
        </>
      }
    >
      {genres.length > 0 && (
        <Group gap="xs" aria-label="Genres">
          {genres.map((genre) => (
            <Badge key={genre} variant="light" color="signal">
              {genre}
            </Badge>
          ))}
        </Group>
      )}
    </TitleHero>
  );
};
