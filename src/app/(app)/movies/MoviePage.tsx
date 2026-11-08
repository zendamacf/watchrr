'use client';

import { Alert, Space, TextInput } from '@mantine/core';
import { useDebouncedState, useDisclosure } from '@mantine/hooks';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Film, Search } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FloatingButton } from '@/components/FloatingButton';
import { InfiniteScrollSentinel } from '@/components/InfiniteScroll';
import { MediaGridSkeleton } from '@/components/MediaGridSkeleton';
import { QueryKey } from '@/components/QueryProvider';
import { flattenPages, pagedQueryOptions } from '@/lib/query/paged';
import { apiRoutes } from '@/lib/routes';
import type { MoviesResponse } from '@/types';
import { AddMovieModal } from './AddMovieModal';
import { MovieList } from './MovieList';

export const MoviePage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useDebouncedState('', 200);

  const { isLoading, isError, data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...pagedQueryOptions<MoviesResponse[number]>(QueryKey.getMovies, apiRoutes.movie, {
      search: search.trim() || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const movies = useMemo(() => flattenPages(data, (movie) => movie.id), [data]);

  return (
    <>
      <AddMovieModal opened={opened} onClose={close} size={'xl'} />
      <TextInput
        placeholder={'Search'}
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      {isLoading ? (
        <MediaGridSkeleton />
      ) : isError ? (
        <Alert color={'red'}>An error occurred</Alert>
      ) : (
        <>
          {movies.length ? (
            <MovieList movies={movies} />
          ) : search.trim() ? (
            <EmptyState
              icon={<Film size={40} aria-hidden />}
              title="No movies match"
              description="Try a different search."
            />
          ) : (
            <EmptyState
              icon={<Film size={40} aria-hidden />}
              title="No movies yet"
              description="Add a movie to keep track of when it's released."
              action={{ label: 'Add a movie', onClick: open }}
            />
          )}
          <InfiniteScrollSentinel
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            loadedCount={movies.length}
          />
        </>
      )}
      <FloatingButton onClick={open} />
    </>
  );
};
