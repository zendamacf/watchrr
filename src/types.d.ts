import { episodes, movies, tvshows } from '@/lib/db/schema';

type Show = typeof tvshows.$inferSelect;
type Episode = typeof episodes.$inferSelect;
type Movie = typeof movies.$inferSelect;
