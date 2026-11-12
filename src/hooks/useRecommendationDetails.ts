'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import type { Recommendation, RecommendationDetails } from '@/lib/recommendations/types';
import { apiRoutes } from '@/lib/routes';

/** Details are cached for a day in the browser, matching the server, so reopening a card costs nothing. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** The viewer's region for streaming availability, from the browser locale (`en-NZ` is `NZ`). */
export const browserRegion = (): string | undefined => {
  try {
    return new Intl.Locale(navigator.language).region;
  } catch {
    return undefined;
  }
};

/** Extra TMDB information about a recommendation. Pass `null` to stay idle until a card is opened. */
export function useRecommendationDetails(target: Pick<Recommendation, 'type' | 'moviedb_id'> | null) {
  const region = browserRegion();

  return useQuery<RecommendationDetails>({
    queryKey: [QueryKey.getRecommendationDetails, target?.type, target?.moviedb_id, region],
    queryFn: async () => {
      const params = new URLSearchParams({ type: target!.type, moviedb_id: String(target!.moviedb_id) });
      if (region) params.set('region', region);
      const response = await apiFetch(apiRoutes.recommendationDetails(params));
      if (!response.ok) throw new Error((await response.json()).message);
      return response.json();
    },
    enabled: target !== null,
    staleTime: DAY_MS,
    gcTime: DAY_MS,
    retry: 1,
  });
}
