import { tmdb } from './client';
import { tmdbDateToIso } from './dates';
import { DETAILS_APPEND, mapExtras, type TMDBTitleDetails } from './extras';
import type { TMDBGenre } from './tvshows';

export type TMDBMovie = {
  id: number;
  name: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  releasedate: string | null;
  /** Runtime in minutes */
  runtime: number | null;
  /** Only populated by details; search results leave it empty. */
  genres: TMDBGenre[];
};

/**
 * Search for movies.
 * @param query The search query
 * @returns A list of movies found
 */
export const search = async (query: string): Promise<TMDBMovie[]> => {
  const data = await tmdb.search.movies({ query });
  return data.results.map(mapListResult);
};

type TMDBMovieListResult = {
  id: number;
  title: string;
  overview: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date: string;
};

/** Maps a search/recommendation list entry, which lacks runtime and genres. */
const mapListResult = (d: TMDBMovieListResult): TMDBMovie => ({
  id: d.id,
  name: d.title,
  description: d.overview,
  poster: d.poster_path ?? null,
  backdrop: d.backdrop_path ?? null,
  releasedate: tmdbDateToIso(d.release_date),
  runtime: null,
  genres: [],
});

/**
 * Get movies TMDB recommends based on a movie (first page only).
 * @param moviedb_id The movie's ID in The Movie DB.
 * @returns A list of recommended movies
 */
export const getMovieRecommendations = async (moviedb_id: number): Promise<TMDBMovie[]> => {
  const data = await tmdb.movies.recommendations(moviedb_id);
  return data.results.map(mapListResult);
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
    runtime: data.runtime || null,
    genres: (data.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
  };
};

/**
 * Get a movie's rating, genres, cast, trailer and streaming providers, in one request.
 * @param moviedb_id The movie's ID in The Movie DB.
 */
export const getMovieDetails = async (moviedb_id: number): Promise<TMDBTitleDetails> => {
  const d = await tmdb.movies.details(moviedb_id, [...DETAILS_APPEND]);
  return {
    tagline: d.tagline || null,
    genres: (d.genres ?? []).map((g) => g.name),
    rating: d.vote_count ? d.vote_average : null,
    votes: d.vote_count ?? 0,
    runtime: d.runtime || null,
    seasons: null,
    status: d.status || null,
    ...mapExtras(d),
  };
};
