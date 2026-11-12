/** Types shared by the server query and the client, so the UI never imports database code. */

export type RecommendationType = 'movie' | 'tvshow';

export type Recommendation = {
  type: RecommendationType;
  /** TMDB id. Candidates are not tracked yet, so they have no watchrr id. */
  moviedb_id: number;
  name: string;
  description: string | null;
  poster_slug: string | null;
  backdrop_slug: string | null;
  /** Movies only. */
  releasedate: string | null;
  /** Shows only. */
  country: string | null;
  score: number;
  /** Tracked items that led to this recommendation, strongest first, at most `BECAUSE_LIMIT`. */
  because: string[];
  /** How many more tracked items recommend it beyond those in `because`. */
  because_more: number;
};

/** How many tracked items a recommendation names as its reason. */
export const BECAUSE_LIMIT = 3;
