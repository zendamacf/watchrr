'use client';

import { Movie } from '@/@types';
import { SimpleGrid } from '@mantine/core';
import { MovieCard } from './MovieCard';

type Props = { movies: Movie[]; onRemove: () => void };

export const MovieList = ({ movies, onRemove }: Props) => {
  return (
    <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onRemove={onRemove} />
      ))}
    </SimpleGrid>
  );
};
