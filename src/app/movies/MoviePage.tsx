'use client';

import { Movie } from '@/types';
import { ActionIcon, Affix, Alert, Center, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { AddMovieModal } from './AddMovieModal';
import { MovieList } from './MovieList';

export const MoviePage = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const { isLoading, isError, data, refetch } = useQuery<Movie[]>({
    queryKey: ['getMovies'],
    queryFn: async () => {
      const response = await fetch('/api/movie', { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });

  if (isLoading)
    return (
      <Center>
        <Loader />
      </Center>
    );
  if (isError) return <Alert color={'red'}>An error occurred</Alert>;

  return (
    <>
      <AddMovieModal opened={opened} onAdd={() => refetch()} onClose={close} size={'xl'} />
      <MovieList movies={data ?? []} onRemove={() => refetch()} />
      <Affix position={{ bottom: 30, right: 30 }}>
        <ActionIcon radius="xl" size={60} onClick={open}>
          <Plus size={30} />
        </ActionIcon>
      </Affix>
    </>
  );
};
