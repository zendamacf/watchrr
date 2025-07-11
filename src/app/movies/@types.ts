import { movies } from '@/lib/db/schema';
import { Movie as TMDBMovie } from 'tmdb-ts';

export type Movie = typeof movies.$inferSelect;

export type MovieSearch = TMDBMovie;
