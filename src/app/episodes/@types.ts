import { episodes, tvshows } from '@/lib/db/schema';

export type Episode = {
  episodes: typeof episodes.$inferSelect;
  tvshows: typeof tvshows.$inferSelect;
};

export type ISOEpisode = {
  episodes: typeof episodes.$inferSelect & { local_date: string; in_past: boolean };
  tvshows: typeof tvshows.$inferSelect;
};
