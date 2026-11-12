import type { DismissalReason, RecommendationType } from './types';

export const RECOMMENDATION_TYPES: readonly RecommendationType[] = ['movie', 'tvshow'];

export const isRecommendationType = (value: unknown): value is RecommendationType =>
  typeof value === 'string' && (RECOMMENDATION_TYPES as readonly string[]).includes(value);

/** A TMDB id is a positive 32-bit integer (the column type). */
export const isMoviedbId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2_147_483_647;

export const DISMISSAL_REASONS: readonly DismissalReason[] = ['not_interested', 'already_watched'];

export const isDismissalReason = (value: unknown): value is DismissalReason =>
  typeof value === 'string' && (DISMISSAL_REASONS as readonly string[]).includes(value);
