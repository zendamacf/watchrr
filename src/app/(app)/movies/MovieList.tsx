'use client';

import { MediaGrid } from '@/components/MediaGrid';
import type { Movie } from '@/types';
import { MovieCard } from './MovieCard';

type Props = { movies: Movie[] };

export const MovieList = ({ movies }: Props) => {
  return (
    <MediaGrid>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </MediaGrid>
  );
};
