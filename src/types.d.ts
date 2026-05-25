import type { EpisodePublic, MoviePublic, ShowPublic } from '@/lib/db/public-media';
import { episodes, movies, tvshows } from '@/lib/db/schema';

/** Full DB row (internal/tests). */
export type Show = typeof tvshows.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type Movie = typeof movies.$inferSelect;

/** Card/search UI; DB assigns `uuid` on insert. */
export type ShowCard = Omit<Show, 'uuid'>;
export type MovieCard = Omit<Movie, 'uuid'>;

export type { EpisodePublic, MoviePublic, ShowPublic };

export type ShowsResponse = ShowPublic[];
export type EpisodesResponse = { episodes: EpisodePublic; tvshows: ShowPublic }[];
export type MoviesResponse = MoviePublic[];
