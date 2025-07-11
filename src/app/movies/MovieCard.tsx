'use client';

import { Movie } from '@/@types';
import { useAlert } from '@/hooks/useAlert';
import { ActionIcon, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { BaseMovieCard } from './BaseMovieCard';

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
      centered: true,
      onConfirm: () => remove(movie_id),
    });

  return (
    <BaseMovieCard
      h={250}
      movie={{
        ...movie,
        releaseDate: movie.releasedate ? DateTime.fromSQL(movie.releasedate) : null,
      }}
      releaseDate
      description
      actions={
        <>
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
        </>
      }
    />
  );
};
