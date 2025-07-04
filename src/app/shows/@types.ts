import { tvshows } from '@/lib/db/schema';

export type Show = typeof tvshows.$inferSelect;
