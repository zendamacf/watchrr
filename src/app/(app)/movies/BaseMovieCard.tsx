'use client';

import { type CardProps, Group, Popover, PopoverDropdown, PopoverTarget, Text, Title } from '@mantine/core';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { MediaCard } from '@/components/MediaCard';
import type { Movie, MovieCard } from '@/types';
import { DateFormat } from '@/utils/dates';

type MovieDisplay = (Movie | MovieCard) & { releaseDate: DateTime | null };

type Props = {
  movie: Omit<MovieDisplay, 'releasedate'>;
  releaseDate?: boolean;
  description?: boolean;
  actions?: ReactNode;
} & CardProps;

export const BaseMovieCard = ({ movie, releaseDate, description, actions, ...props }: Props) => {
  const inPast = !!movie.releaseDate && movie.releaseDate.startOf('day') < DateTime.now().startOf('day');

  return (
    <MediaCard
      {...props}
      backdrop={movie.backdrop_slug}
      poster={movie.poster_slug}
      posterAlt={`Poster for ${movie.name}`}
      footer={
        actions && (
          <Group justify={'end'} gap={'xs'}>
            {actions}
          </Group>
        )
      }
    >
      <Title order={3}>{movie.name}</Title>
      {releaseDate && (
        <Text c={inPast ? 'orange' : undefined} size={'sm'}>
          {movie.releaseDate?.toFormat(DateFormat.DMY) ?? 'Unknown release date'}
        </Text>
      )}
      {description && (
        <Popover width={'unset'}>
          <PopoverTarget>
            <Text c={'dimmed'} lineClamp={3}>
              {movie.description}
            </Text>
          </PopoverTarget>
          <PopoverDropdown>
            <Text>{movie.description}</Text>
          </PopoverDropdown>
        </Popover>
      )}
    </MediaCard>
  );
};
