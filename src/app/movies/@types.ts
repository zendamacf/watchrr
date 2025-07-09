import { movies } from '@/lib/db/schema';

export type Movie = typeof movies.$inferSelect;
