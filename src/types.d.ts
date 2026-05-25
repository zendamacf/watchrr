import { episodes, movies, tvshows } from '@/lib/db/schema';

export type Show = typeof tvshows.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type Movie = typeof movies.$inferSelect;

/** TMDB search preview; `uuid` assigned on subscribe. */
export type ShowCard = Omit<Show, 'uuid'>;
export type MovieCard = Omit<Movie, 'uuid'>;

export type ShowsResponse = Show[];
export type EpisodesResponse = { episodes: Episode; tvshows: Show }[];
export type MoviesResponse = Movie[];
