'use client';

import { ActionIcon, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { apiRoutes } from '@/lib/routes';
import type { Movie, MoviesResponse } from '@/types';
import { BaseMovieCard } from './BaseMovieCard';

type Props = {
  movie: Movie;
};

type MutationContext = { previousMovies: MoviesResponse | undefined };

export const MovieCard = ({ movie }: Props) => {
  const { showError, showSuccess } = useAlert();

  const onMutate = async (movie_id: number, callback?: () => void): Promise<MutationContext> => {
    // Cancel ongoing refetch to not overwrite optimistic update
    await queryClient.cancelQueries({ queryKey: [QueryKey.getMovies] });
    const previousMovies = queryClient.getQueryData<MoviesResponse>([QueryKey.getMovies]);
    queryClient.setQueryData<MoviesResponse>([QueryKey.getMovies], (old) => old?.filter((o) => o.id !== movie_id));
    if (callback) callback();
    return { previousMovies }; // Context for rollback
  };

  const onError = (error: Error, _vars: unknown, context: MutationContext | undefined) => {
    showError({ title: 'An error occurred', message: error.message });
    // Revert optimistic update
    queryClient.setQueryData([QueryKey.getEpisodes], context?.previousMovies);
  };

  const queryClient = useQueryClient();
  const { mutate: watched, isPending: pendingWatched } = useMutation<unknown, Error, number, MutationContext>({
    mutationFn: async (movie_id) => {
      const response = await fetch(apiRoutes.movieById(movie_id), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: (movie_id) =>
      onMutate(movie_id, () => showSuccess({ title: 'Nice!', message: `You watched ${movie.name}` })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] }),
    onError,
  });

  const { mutate: remove, isPending: pendingRemove } = useMutation<unknown, Error, number, MutationContext>({
    mutationFn: async (movie_id) => {
      const response = await fetch(apiRoutes.movieById(movie_id), { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: (movie_id) =>
      onMutate(movie_id, () =>
        showSuccess({ title: 'All done!', message: `You are no longer following ${movie.name}` }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] }),
    onError,
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
          <ActionIcon loading={pendingWatched} onClick={() => watched(movie.id)}>
            <Check size={'20'} />
          </ActionIcon>
          <ActionIcon color={'red'} loading={pendingRemove} onClick={() => confirmUnsubscribe(movie.id)}>
            <X size={'20'} />
          </ActionIcon>
        </>
      }
    />
  );
};
