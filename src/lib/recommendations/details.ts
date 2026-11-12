import { createTtlCache } from '../themoviedb/cache';
import type { TMDBTitleDetails } from '../themoviedb/extras';
import { getMovieDetails } from '../themoviedb/movies';
import { getTvShowDetails } from '../themoviedb/tvshows';
import type { RecommendationDetails, RecommendationType } from './types';

/** Region used for streaming providers when the client does not say. */
export const DEFAULT_REGION = 'US';

/** Details change slowly (ratings drift, providers come and go), so a day is plenty. */
const DETAILS_TTL_MS = 24 * 60 * 60 * 1000;

/** Keyed by type and TMDB id, not region, so users in different regions share one TMDB request. */
const cache = createTtlCache<TMDBTitleDetails>({ ttlMs: DETAILS_TTL_MS, maxEntries: 500 });

/** An ISO 3166-1 alpha-2 region code, case-insensitive. Returns it uppercased, or null if malformed. */
export const parseRegion = (value: string | null): string | null => {
  const region = value?.toUpperCase();
  return region && /^[A-Z]{2}$/.test(region) ? region : null;
};

/**
 * TMDB details for a recommendation candidate, with streaming providers for one region.
 * Cached in memory and shared across users; Discover itself never calls TMDB.
 * @throws if TMDB fails or does not know the title.
 */
export async function getRecommendationDetails(
  type: RecommendationType,
  moviedbId: number,
  region: string = DEFAULT_REGION,
): Promise<RecommendationDetails> {
  const { watch, trailer, ...details } = await cache.get(`${type}:${moviedbId}`, () =>
    type === 'movie' ? getMovieDetails(moviedbId) : getTvShowDetails(moviedbId),
  );
  const here = watch[region];

  return {
    ...details,
    trailer,
    providers: (here?.providers ?? []).map((p) => ({ name: p.name, logo: p.logo })),
    providers_link: here?.link ?? null,
  };
}

/** @internal Vitest only — clears cached details between tests. */
export function resetRecommendationDetailsCacheForTests(): void {
  cache.clear();
}
