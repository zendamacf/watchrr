import { AddMediaModal } from '@/components/AddMediaModal';
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
import { useMutation } from '@tanstack/react-query';
import { List, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { BaseMovieCard } from './BaseMovieCard';

type Props = { onAdd: () => void } & ModalProps;

export const AddMovieModal = ({ onAdd, ...props }: Props) => {
  const { showSuccess, showError } = useAlert();

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
      onAdd();
      showSuccess('Nice!', `You're now following ${movie.name}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  return (
    <AddMediaModal<TMDBMovie>
      title={'Add Movie'}
      {...props}
      queryKey={'searchMovies'}
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
                    <List />
                  </ActionIcon>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text>{movie.description}</Text>
                </PopoverDropdown>
              </Popover>
              <ActionIcon
                loaderProps={{ type: 'dots' }}
                loading={pendingAdd}
                onClick={() => add({ moviedb_id: movie.id, name: movie.name })}
              >
                <Plus />
              </ActionIcon>
            </>
          }
        />
      )}
    />
  );
};
