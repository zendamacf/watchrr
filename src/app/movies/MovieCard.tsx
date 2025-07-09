'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { useAlert } from '@/hooks/useAlert';
import { getImageUrl } from '@/lib/themoviedb/images';
import { ActionIcon, Group, Image, Space, Stack, Text, Title } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { Movie } from './@types';

type Props = {
  movie: Movie;
  onRemove: (movie_id: number) => void;
};

export const MovieCard = ({ movie, onRemove }: Props) => {
  const { showError, showSuccess } = useAlert();

  const { mutate: watched, isPending: pendingWatched } = useMutation<unknown, Error, number>({
    mutationFn: async (movie_id) => {
      const response = await fetch(`/api/movie/${movie_id}/`, { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, movie_id) => {
      onRemove(movie_id);
      showSuccess('Nice!', `You watched ${movie.name}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  const { mutate: remove, isPending: pendingRemove } = useMutation<unknown, Error, number>({
    mutationFn: async (movie_id) => {
      const response = await fetch(`/api/movie/${movie_id}/`, { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, movie_id) => {
      onRemove(movie_id);
      showSuccess('All done!', `You are no longer following ${movie.name}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  const confirmUnsubscribe = (movie_id: number) =>
    openConfirmModal({
      title: 'Are you sure?',
      children: <Text size="sm">Do you want to stop following {movie.name}?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove(movie_id),
    });

  const releaseDate = movie.releasedate ? DateTime.fromSQL(movie.releasedate) : null;
  const inPast = !!releaseDate && releaseDate < DateTime.now();

  return (
    <BackdropCard h={250} style={{ width: '100%' }} backdrop={movie.backdrop_slug}>
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
            <Text c={inPast ? 'orange' : undefined} size={'sm'}>
              {releaseDate?.toFormat('cccc dd/LL/kkkk') ?? 'Unknown release date'}
            </Text>
            <Space h={'xs'} />
            <Text c={'dimmed'} lineClamp={3}>
              {movie.description}
            </Text>
          </Stack>
          <Group justify={'end'}>
            <ActionIcon
              loaderProps={{ type: 'dots' }}
              loading={pendingWatched}
              onClick={() => watched(movie.id)}
            >
              <Check />
            </ActionIcon>
            <ActionIcon
              color={'red'}
              loaderProps={{ type: 'dots' }}
              loading={pendingRemove}
              onClick={() => confirmUnsubscribe(movie.id)}
            >
              <X />
            </ActionIcon>
          </Group>
        </Stack>
      </Group>
    </BackdropCard>
  );
};
