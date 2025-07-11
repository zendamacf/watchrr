import { useAlert } from '@/hooks/useAlert';
import { TMDBMovie } from '@/lib/themoviedb/movies';
import {
  ActionIcon,
  LoadingOverlay,
  Modal,
  ModalProps,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  SimpleGrid,
  Space,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { List, Plus, Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { BaseMovieCard } from './BaseMovieCard';

type Props = { onAdd: () => void } & ModalProps;

export const AddMovieModal = ({ onAdd, ...props }: Props) => {
  const [search, setSearch] = useDebouncedState('', 500);
  const { showSuccess, showError } = useAlert();

  const { isFetching, data } = useQuery<TMDBMovie[]>({
    queryKey: ['searchMovies', search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const params = new URLSearchParams({ q: search.trim() });
      const response = await fetch(`/api/movie/search?${params.toString()}`, { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
    placeholderData: (prev) => prev,
  });

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
    <Modal title={'Add Movie'} {...props}>
      <TextInput
        label="Search"
        placeholder="Search"
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      <div style={{ position: 'relative' }}>
        <LoadingOverlay
          loaderProps={{ type: 'dots' }}
          visible={isFetching}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        <SimpleGrid cols={{ xs: 1, sm: 2 }}>
          {data?.map((movie) => (
            <BaseMovieCard
              key={movie.id}
              h={200}
              movie={{
                ...movie,
                moviedb_id: movie.id,
                poster_slug: movie.poster ?? null,
                backdrop_slug: movie.backdrop ?? null,
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
          ))}
        </SimpleGrid>
      </div>
    </Modal>
  );
};
