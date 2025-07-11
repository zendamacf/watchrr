'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { getImageUrl } from '@/lib/themoviedb/images';
import { Movie } from '@/types';
import { DateFormat } from '@/utils/dates';
import {
  CardProps,
  Group,
  Image,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Space,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { DateTime } from 'luxon';
import { ReactNode } from 'react';

type Props = {
  movie: Omit<Movie, 'releasedate'> & { releaseDate: DateTime | null };
  releaseDate?: boolean;
  description?: boolean;
  actions?: ReactNode;
} & CardProps;

export const BaseMovieCard = ({ movie, releaseDate, description, actions, ...props }: Props) => {
  const inPast = !!movie.releaseDate && movie.releaseDate < DateTime.now();

  return (
    <BackdropCard {...props} style={{ width: '100%' }} backdrop={movie.backdrop_slug}>
      <Group h={'100%'} align={'center'}>
        <Image
          src={movie.poster_slug ? getImageUrl(movie.poster_slug) : undefined}
          fallbackSrc={'/placeholder.jpg'}
          alt={`Poster for ${movie.name}`}
          flex={1}
          mah={'100%'}
          style={{ objectFit: 'contain' }}
        />
        <Stack h={'100%'} justify={'space-between'} gap={'sm'} flex={2}>
          <Stack gap={0}>
            <Title order={3}>{movie.name}</Title>
            {releaseDate && (
              <Text c={inPast ? 'orange' : undefined} size={'sm'}>
                {movie.releaseDate?.toFormat(DateFormat.DMY) ?? 'Unknown release date'}
              </Text>
            )}
            {releaseDate && description && <Space h={'xs'} />}
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
          </Stack>
          {actions && <Group justify={'end'}>{actions}</Group>}
        </Stack>
      </Group>
    </BackdropCard>
  );
};
