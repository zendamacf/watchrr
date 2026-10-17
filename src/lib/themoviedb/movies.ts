import { tmdb } from './client';
import { tmdbDateToIso } from './dates';

export type TMDBMovie = {
  id: number;
  name: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  releasedate: string | null;
};

/**
 * Search for movies.
 * @param query The search query
 * @returns A list of movies found
 */
export const search = async (query: string): Promise<TMDBMovie[]> => {
  const data = await tmdb.search.movies({ query });
  return data.results.map<TMDBMovie>((d) => ({
    id: d.id,
    name: d.title,
    description: d.overview,
    poster: d.poster_path,
    backdrop: d.backdrop_path,
    releasedate: tmdbDateToIso(d.release_date),
  }));
};

/**
 * Get a movie.
 * @param moviedb_id The movie's ID in The Movie DB.
 * @returns The TV show
 */
export const getMovie = async (moviedb_id: number): Promise<TMDBMovie> => {
  const data = await tmdb.movies.details(moviedb_id);
  return {
    id: data.id,
    name: data.title,
    description: data.overview,
    poster: data.poster_path ?? null,
    backdrop: data.backdrop_path,
    releasedate: tmdbDateToIso(data.release_date),
  };
};
