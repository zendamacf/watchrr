'use client';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { flattenPages, pagedQueryOptions, totalOf } from '@/lib/query/paged';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse } from '@/types';

type EpisodeRow = EpisodesResponse[number];

type EpisodeFilters = {
  search?: string;
  /** `true` = only snoozed shows, `false` = only scheduled shows, omitted = both. */
  snoozed?: boolean;
};

export function useEpisodesQuery({ search, snoozed }: EpisodeFilters = {}) {
  const query = useInfiniteQuery({
    ...pagedQueryOptions<EpisodeRow>(QueryKey.getEpisodes, apiRoutes.episode, {
      search: search?.trim() || undefined,
      snoozed: snoozed === undefined ? undefined : String(snoozed),
    }),
    placeholderData: keepPreviousData,
  });

  const episodes = useMemo(() => flattenPages(query.data, (row) => row.episodes.id), [query.data]);
  return { ...query, episodes, total: totalOf(query.data) };
}

export function useSnoozedEpisodes() {
  const { episodes, total, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useEpisodesQuery({
    snoozed: true,
  });

  return { episodes, total, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage };
}

export const useSnoozedEpisodeCount = () => useSnoozedEpisodes().total;
