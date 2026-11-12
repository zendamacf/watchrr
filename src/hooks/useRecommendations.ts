'use client';

import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { apiFetch } from '@/lib/api/fetch';
import { flattenPages, pagedQueryOptions, restorePaged, snapshotPaged, totalOf, updatePaged } from '@/lib/query/paged';
import type { Recommendation, RecommendationType } from '@/lib/recommendations/types';
import { apiRoutes } from '@/lib/routes';

/** Candidates are not tracked, so a row is identified by type and TMDB id together. */
export const recommendationId = (row: Pick<Recommendation, 'type' | 'moviedb_id'>) => `${row.type}-${row.moviedb_id}`;

/** The user's recommendations, loaded page by page. Omit `type` for movies and shows together. */
export function useRecommendationsQuery({ type }: { type?: RecommendationType } = {}) {
  const query = useInfiniteQuery({
    ...pagedQueryOptions<Recommendation>(QueryKey.getRecommendations, apiRoutes.recommendations(), { type }),
    placeholderData: keepPreviousData,
  });

  const recommendations = useMemo(() => flattenPages(query.data, recommendationId), [query.data]);
  return { ...query, recommendations, total: totalOf(query.data) };
}

type Target = Pick<Recommendation, 'type' | 'moviedb_id' | 'name'>;

/** Remove one candidate from every cached variant of the list (all filters). */
const removeFromCache = (queryClient: QueryClient, target: Pick<Target, 'type' | 'moviedb_id'>) =>
  updatePaged<Recommendation>(queryClient, QueryKey.getRecommendations, (rows) =>
    rows.filter((row) => recommendationId(row) !== recommendationId(target)),
  );

/** Returns a function that drops a candidate from the list, e.g. once it has been added. */
export function useRemoveRecommendation() {
  const queryClient = useQueryClient();
  return (target: Pick<Target, 'type' | 'moviedb_id'>) => removeFromCache(queryClient, target);
}

/** Hide a candidate for good. The card disappears immediately and returns if the request fails. */
export function useNotInterested() {
  const queryClient = useQueryClient();
  const { showError } = useAlert();

  return useMutation<unknown, Error, Target, { snapshot: ReturnType<typeof snapshotPaged> }>({
    mutationFn: async ({ type, moviedb_id }) => {
      const response = await apiFetch(apiRoutes.notInterested, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, moviedb_id }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (target) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getRecommendations] });
      const snapshot = snapshotPaged(queryClient, QueryKey.getRecommendations);
      removeFromCache(queryClient, target);
      return { snapshot };
    },
    onError: (error, target, context) => {
      restorePaged(queryClient, context?.snapshot);
      showError({ title: 'An error occurred', message: `Could not hide ${target.name}: ${error.message}` });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.getRecommendations] });
    },
  });
}
