import { episodes, tvshows } from '@/lib/db/schema';
import { DateTime } from 'luxon';

export type Episode = {
  episodes: typeof episodes.$inferSelect & { local_date: DateTime; in_past: boolean };
  tvshows: typeof tvshows.$inferSelect;
};
