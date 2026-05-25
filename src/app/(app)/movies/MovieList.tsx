'use client';

import { SimpleGrid } from '@mantine/core';
import type { Movie } from '@/types';
import { MovieCard } from './MovieCard';

type Props = { movies: Movie[] };

export const MovieList = ({ movies }: Props) => {
  return (
    <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
      {movies.map((movie) => (
        <MovieCard key={movie.uuid} movie={movie} />
      ))}
    </SimpleGrid>
  );
};
