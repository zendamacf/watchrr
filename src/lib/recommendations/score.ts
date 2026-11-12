/**
 * Recommendation scoring.
 *
 * A candidate scores `SOURCE_WEIGHT` for every distinct item the user tracks
 * that TMDB recommends it from, plus `FINISHED_BONUS` when that source item is
 * one the user finished (a watched movie, or a show with every aired episode
 * watched). `list.ts` applies the same weights in SQL so results can be
 * ordered and paginated in the database.
 */

export const SOURCE_WEIGHT = 1;
export const FINISHED_BONUS = 1;

export type ScoreSource = { finished: boolean };

/** Weight a single recommending source contributes to a candidate's score. */
export function sourceWeight(source: ScoreSource): number {
  return SOURCE_WEIGHT + (source.finished ? FINISHED_BONUS : 0);
}

/** Total score for a candidate recommended by the given sources. */
export function scoreRecommendation(sources: ScoreSource[]): number {
  return sources.reduce((total, source) => total + sourceWeight(source), 0);
}
