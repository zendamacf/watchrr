import type { RecommendationType } from './types';

export const RECOMMENDATION_TYPES: readonly RecommendationType[] = ['movie', 'tvshow'];

export const isRecommendationType = (value: unknown): value is RecommendationType =>
  typeof value === 'string' && (RECOMMENDATION_TYPES as readonly string[]).includes(value);

/** A TMDB id is a positive 32-bit integer (the column type). */
export const isMoviedbId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2_147_483_647;
