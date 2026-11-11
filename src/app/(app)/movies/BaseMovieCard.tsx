'use client';

import {
  Anchor,
  type CardProps,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ChevronRight } from 'lucide-react';
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
  titleHref?: string;
} & CardProps;

export const BaseMovieCard = ({ movie, releaseDate, description, actions, titleHref, ...props }: Props) => {
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
      {titleHref ? (
        <Anchor href={titleHref} underline="never" c="inherit">
          <Stack gap={2}>
            <Title order={3}>{movie.name}</Title>
            <Group gap={4} wrap="nowrap" c="var(--mantine-color-anchor)">
              <Text size="sm" fw={500} component="span">
                View movie
              </Text>
              <ChevronRight size={16} aria-hidden />
            </Group>
          </Stack>
        </Anchor>
      ) : (
        <Title order={3}>{movie.name}</Title>
      )}
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
