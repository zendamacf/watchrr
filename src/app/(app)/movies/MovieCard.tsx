'use client';

import { ActionIcon, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { apiRoutes } from '@/lib/routes';
import type { MoviePublic, MoviesResponse } from '@/types';
import { BaseMovieCard } from './BaseMovieCard';

type Props = {
  movie: MoviePublic;
};

type MutationContext = { previousMovies: MoviesResponse | undefined };

export const MovieCard = ({ movie }: Props) => {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();

  const onMutate = async (movieUuid: string, callback?: () => void): Promise<MutationContext> => {
    await queryClient.cancelQueries({ queryKey: [QueryKey.getMovies] });
    const previousMovies = queryClient.getQueryData<MoviesResponse>([QueryKey.getMovies]);
    queryClient.setQueryData<MoviesResponse>([QueryKey.getMovies], (old) => old?.filter((o) => o.uuid !== movieUuid));
    if (callback) callback();
    return { previousMovies };
  };

  const onError = (error: Error, _vars: unknown, context: MutationContext | undefined) => {
    showError({ title: 'An error occurred', message: error.message });
    queryClient.setQueryData([QueryKey.getMovies], context?.previousMovies);
  };

  const { mutate: watched, isPending: pendingWatched } = useMutation<unknown, Error, string, MutationContext>({
    mutationFn: async (movieUuid) => {
      const response = await fetch(apiRoutes.movieById(movieUuid), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: (movieUuid) =>
      onMutate(movieUuid, () => showSuccess({ title: 'Nice!', message: `You watched ${movie.name}` })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] }),
    onError,
  });

  const { mutate: remove, isPending: pendingRemove } = useMutation<unknown, Error, string, MutationContext>({
    mutationFn: async (movieUuid) => {
      const response = await fetch(apiRoutes.movieById(movieUuid), { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: (movieUuid) =>
      onMutate(movieUuid, () =>
        showSuccess({ title: 'All done!', message: `You are no longer following ${movie.name}` }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] }),
    onError,
  });

  const confirmUnsubscribe = (movieUuid: string) =>
    openConfirmModal({
      title: 'Are you sure?',
      children: <Text size="sm">Do you want to stop following {movie.name}?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      centered: true,
      onConfirm: () => remove(movieUuid),
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
          <ActionIcon aria-label="Mark watched" loading={pendingWatched} onClick={() => watched(movie.uuid)}>
            <Check size={'20'} />
          </ActionIcon>
          <ActionIcon
            aria-label="Unsubscribe"
            color={'red'}
            loading={pendingRemove}
            onClick={() => confirmUnsubscribe(movie.uuid)}
          >
            <X size={'20'} />
          </ActionIcon>
        </>
      }
    />
  );
};
