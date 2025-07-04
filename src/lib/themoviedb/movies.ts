import { tmdb } from './client';

type Movie = {
  id: number;
  name: string;
  description: string;
  poster: string | undefined;
  backdrop: string | undefined;
  releaseDate: Date;
};

/**
 * Search for movies.
 * @param query The search query
 * @returns A list of movies found
 */
export const search = async (query: string): Promise<Movie[]> => {
  const data = await tmdb.search.movies({ query });
  return data.results.map<Movie>((d) => ({
    id: d.id,
    name: d.title,
    description: d.overview,
    poster: d.poster_path,
    backdrop: d.backdrop_path,
    releaseDate: new Date(d.release_date),
  }));
};

/**
 * Get a movie.
 * @param moviedb_id The movie's ID in The Movie DB.
 * @returns The TV show
 */
export const getMovie = async (moviedb_id: number): Promise<Movie> => {
  const data = await tmdb.movies.details(moviedb_id);
  return {
    id: data.id,
    name: data.title,
    description: data.overview,
    poster: data.poster_path,
    backdrop: data.backdrop_path,
    releaseDate: new Date(data.release_date),
  };
};
