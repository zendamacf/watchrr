import { episodes, movies, tvshows } from '@/lib/db/schema';

export type Show = typeof tvshows.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type Movie = typeof movies.$inferSelect;

export type ShowsResponse = Show[];
export type EpisodesResponse = { episodes: Episode; tvshows: Show }[];
export type MoviesResponse = Movie[];
