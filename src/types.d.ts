import { episodes, movies, tvshows } from '@/lib/db/schema';

type Show = typeof tvshows.$inferSelect;
type Episode = typeof episodes.$inferSelect;
type Movie = typeof movies.$inferSelect;

type ShowsResponse = Show[];
type EpisodesResponse = { episodes: Episode; tvshows: Show }[];
type MoviesResponse = Movie[];
