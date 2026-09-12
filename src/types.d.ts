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
export type MoviesResponse = Movie[];
