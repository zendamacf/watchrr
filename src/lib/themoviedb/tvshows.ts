import { tmdb } from './client';

type TvShow = {
  id: number;
  name: string;
  country: string | undefined;
  firstAirDate: Date;
};

/**
 * Search for TV shows.
 * @param query The search query
 * @returns A list of TV shows found
 */
export const search = async (query: string): Promise<TvShow[]> => {
  const data = await tmdb.search.tvShows({ query });
  return data.results.map((d) => ({
    id: d.id,
    name: d.name,
    country: d.origin_country[0],
    firstAirDate: new Date(d.first_air_date),
  }));
};

/**
 * Get a TV show.
 * @param moviddb_id The TV show's ID in The Movie DB.
 * @returns The TV show
 */
export const getTvShow = async (moviddb_id: number): Promise<TvShow> => {
  const data = await tmdb.tvShows.details(moviddb_id);
  return {
    id: data.id,
    name: data.name,
    country: data.origin_country[0],
    firstAirDate: new Date(data.first_air_date),
  };
};
