import { AddMediaModal } from '@/components/AddMediaModal';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { TMDBMovie } from '@/lib/themoviedb/movies';
import {
  ActionIcon,
  ModalProps,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Text,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { BaseMovieCard } from './BaseMovieCard';

type Props = ModalProps;

export const AddMovieModal = (props: Props) => {
  const { showSuccess, showError } = useAlert();

  const queryClient = useQueryClient();
  const { mutate: add, isPending: pendingAdd } = useMutation<
    unknown,
    Error,
    { moviedb_id: number; name: string }
  >({
    mutationFn: async (movie) => {
      const response = await fetch('/api/movie', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moviedb_id: movie.moviedb_id }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, movie) => {
      showSuccess({ title: 'Nice!', message: `You're now following ${movie.name}` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] });
    },
    onError(error) {
      showError({ title: 'An error occurred', message: error.message });
    },
  });

  return (
    <AddMediaModal<TMDBMovie>
      title={'Add Movie'}
      {...props}
      queryKey={QueryKey.searchMovies}
      queryFn={async (search) => {
        const params = new URLSearchParams({ q: search.trim() });
        const response = await fetch(`/api/movie/search?${params.toString()}`, { method: 'get' });
        if (response.ok) return await response.json();
        throw new Error((await response.json()).message);
      }}
      builder={(movie) => (
        <BaseMovieCard
          key={movie.id}
          h={200}
          movie={{
            ...movie,
            moviedb_id: movie.id,
            poster_slug: movie.poster,
            backdrop_slug: movie.backdrop,
            releaseDate: DateTime.fromISO(movie.releasedate),
          }}
          releaseDate
          actions={
            <>
              <Popover width={'unset'}>
                <PopoverTarget>
                  <ActionIcon color={'blue'}>
                    <List size={'20'} />
                  </ActionIcon>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text>{movie.description}</Text>
                </PopoverDropdown>
              </Popover>
              <ActionIcon
                loading={pendingAdd}
                onClick={() => add({ moviedb_id: movie.id, name: movie.name })}
              >
                <Plus size={'20'} />
              </ActionIcon>
            </>
          }
        />
      )}
    />
  );
};
