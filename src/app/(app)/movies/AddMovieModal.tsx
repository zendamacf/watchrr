import { ActionIcon, type ModalProps, Popover, PopoverDropdown, PopoverTarget, Text } from '@mantine/core';
import { List, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { AddMediaModal } from '@/components/AddMediaModal';
import { QueryKey } from '@/components/QueryProvider';
import { useAddMovie } from '@/hooks/useAddMedia';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { TMDBMovie } from '@/lib/themoviedb/movies';
import { BaseMovieCard } from './BaseMovieCard';

type Props = ModalProps;

export const AddMovieModal = (props: Props) => {
  const { mutate: add, isPending: pendingAdd } = useAddMovie();

  return (
    <AddMediaModal<TMDBMovie>
      title={'Add Movie'}
      {...props}
      queryKey={QueryKey.searchMovies}
      queryFn={async (search) => {
        const params = new URLSearchParams({ q: search.trim() });
        const response = await apiFetch(apiRoutes.movieSearch(params), { method: 'get' });
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
            metadata_refreshed_at: null,
            recommendations_refreshed_at: null,
            releaseDate: movie.releasedate ? DateTime.fromISO(movie.releasedate) : null,
          }}
          releaseDate
          actions={
            <>
              <Popover width={'unset'}>
                <PopoverTarget>
                  <ActionIcon variant="white" color={'gray'} aria-label={`About ${movie.name}`}>
                    <List size={'20'} />
                  </ActionIcon>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text>{movie.description}</Text>
                </PopoverDropdown>
              </Popover>
              <ActionIcon
                aria-label={`Add ${movie.name}`}
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
