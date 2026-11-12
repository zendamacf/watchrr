import { episodes, movies, subscribed_tvshows, tvshows } from '@/lib/db/schema';

export type Show = typeof tvshows.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type Movie = typeof movies.$inferSelect;
export type ShowSubscription = Pick<typeof subscribed_tvshows.$inferSelect, 'delay_days' | 'snoozed_until'>;

/** TMDB search preview; `id` assigned on subscribe. */
export type ShowCard = Omit<Show, 'id'>;
export type MovieCard = Omit<Movie, 'id'>;

export type SubscribedShow = Show & ShowSubscription;
export type ShowsResponse = SubscribedShow[];
export type EpisodesResponse = { episodes: Episode; tvshows: Show; subscription: ShowSubscription }[];
export type ShowEpisode = Episode & { watched: boolean };
export type ShowEpisodesResponse = {
  tvshow: Show;
  subscription: ShowSubscription;
  episodes: ShowEpisode[];
  /** Genre names; empty until the show has been refreshed. */
  genres: string[];
};
export type MovieDetailResponse = {
  movie: Movie;
  subscription: { watched: boolean; watched_at: Date | string | null };
  /** Genre names; empty until the movie has been refreshed. */
  genres: string[];
  /** Cached TMDB recommendations for this movie that the user does not follow or hide yet. */
  similar: import('@/lib/recommendations/types').SimilarMovie[];
};
export type MoviesResponse = Movie[];

export type RecommendationsResponse = import('@/lib/recommendations/types').Recommendation[];
