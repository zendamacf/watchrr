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
  /** Name of the highest-weighted tracked item that led to this recommendation. */
  because: string;
};
