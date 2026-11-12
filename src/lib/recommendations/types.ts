/** Types shared by the server query and the client, so the UI never imports database code. */

export type RecommendationType = 'movie' | 'tvshow';

/** Why a recommendation was hidden. Mirrors the `dismissal_reason` database enum. */
export type DismissalReason = 'not_interested' | 'already_watched';

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

/** Extra information about a candidate, fetched from TMDB when its info modal is opened. */
export type RecommendationDetails = {
  tagline: string | null;
  genres: string[];
  /** TMDB's 0-10 average. Null when nobody has voted. */
  rating: number | null;
  votes: number;
  /** Minutes. Movies only. */
  runtime: number | null;
  /** Shows only. */
  seasons: number | null;
  status: string | null;
  cast: { name: string; character: string | null; photo: string | null }[];
  /** YouTube video key of a trailer. */
  trailer: string | null;
  /** Subscription streaming services in the requested region. */
  providers: { name: string; logo: string | null }[];
  /** TMDB's page listing every way to watch it in the requested region. */
  providers_link: string | null;
};

/** A movie TMDB suggests alongside a tracked one, shown on that movie's page. */
export type SimilarMovie = Pick<Recommendation, 'moviedb_id' | 'name' | 'description' | 'releasedate' | 'poster_slug'>;

/** A show TMDB suggests alongside a tracked one, shown on that show's page. */
export type SimilarShow = Pick<Recommendation, 'moviedb_id' | 'name' | 'description' | 'country' | 'poster_slug'>;
