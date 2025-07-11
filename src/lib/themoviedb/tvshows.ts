import { DateTime } from 'luxon';
import { tmdb } from './client';

export type TMDBTvShow = {
  id: number;
  name: string;
  description: string | null;
  country: string | null;
  firstAirDate: string;
  poster: string | null;
  backdrop: string | null;
};

export type TMDBEpisode = {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  description: string | null;
  airdate: string;
  backdrop: string | null;
};

/**
 * Search for TV shows.
 * @param query The search query
 * @returns A list of TV shows found
 */
export const search = async (query: string): Promise<TMDBTvShow[]> => {
  const data = await tmdb.search.tvShows({ query });
  return data.results.map<TMDBTvShow>((d) => ({
    id: d.id,
    name: d.name,
    description: d.overview,
    country: d.origin_country[0] ?? null,
    firstAirDate: DateTime.fromJSDate(new Date(d.first_air_date)).toISO()!,
    poster: d.poster_path,
    backdrop: d.backdrop_path,
  }));
};

/**
 * Get a TV show.
 * @param moviedb_id The TV show's ID in The Movie DB.
 * @returns The TV show
 */
export const getTvShow = async (moviedb_id: number): Promise<TMDBTvShow> => {
  const data = await tmdb.tvShows.details(moviedb_id);
  return {
    id: data.id,
    name: data.name,
    description: data.overview,
    country: data.origin_country[0] ?? null,
    firstAirDate: DateTime.fromJSDate(new Date(data.first_air_date)).toISO()!,
    poster: data.poster_path,
    backdrop: data.backdrop_path,
  };
};

/**
 * Get all episodes in a TV show.
 * @param moviedb_id The TV show's ID in The Movie DB.
 * @returns A list of the episodes
 */
export const getAllEpisodes = async (moviedb_id: number): Promise<TMDBEpisode[]> => {
  const show = await tmdb.tvShows.details(moviedb_id);
  const allEpisodes: TMDBEpisode[] = [];
  for (const season of show.seasons) {
    const data = await tmdb.tvSeasons.details({
      tvShowID: moviedb_id,
      seasonNumber: season.season_number,
    });
    allEpisodes.push(
      ...data.episodes.map<TMDBEpisode>((d) => ({
        id: d.id,
        seasonNumber: d.season_number,
        episodeNumber: d.episode_number,
        name: d.name,
        description: d.overview,
        airdate: DateTime.fromJSDate(new Date(d.air_date)).toISO()!,
        moviedb_id: d.id,
        backdrop: d.still_path,
      })),
    );
  }
  return allEpisodes;
};
