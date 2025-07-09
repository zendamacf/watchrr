'use client';

import { ActionIcon, Affix, Alert, Center, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Plus, Space } from 'lucide-react';
import { Movie } from './@types';
import { MovieList } from './MovieList';

export const MoviePage = () => {
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
        <Loader type={'dots'} />
      </Center>
    );
  if (isError) return <Alert color={'red'}>An error occurred</Alert>;

  return (
    <>
      <MovieList movies={data ?? []} onRemove={() => refetch()} />
      <Affix position={{ bottom: 30, right: 30 }}>
        <ActionIcon radius="xl" size={60}>
          <Plus size={30} />
        </ActionIcon>
      </Affix>
      <Space style={{ height: '100px' }} />
    </>
  );
};
