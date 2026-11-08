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
  /** Rows per request; defaults to the standard page size. */
  pageSize?: number;
  /** Set to `false` to defer fetching. */
  enabled?: boolean;
};

export function useEpisodesQuery({ search, snoozed, pageSize, enabled }: EpisodeFilters = {}) {
  const query = useInfiniteQuery({
    ...pagedQueryOptions<EpisodeRow>(
      QueryKey.getEpisodes,
      apiRoutes.episode,
      {
        search: search?.trim() || undefined,
        snoozed: snoozed === undefined ? undefined : String(snoozed),
      },
      pageSize,
    ),
    placeholderData: keepPreviousData,
    enabled,
  });

  const episodes = useMemo(() => flattenPages(query.data, (row) => row.episodes.id), [query.data]);
  return { ...query, episodes, total: totalOf(query.data) };
}

/** Snoozed episodes, loaded page by page. Pass `enabled: false` to defer the request. */
export function useSnoozedEpisodes({ enabled }: { enabled?: boolean } = {}) {
  const { episodes, total, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useEpisodesQuery({
    snoozed: true,
    enabled,
  });

  return { episodes, total, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage };
}

/**
 * Number of snoozed episodes.
 *
 * The badge shows on every page, but only needs a count, so this requests a single row and reads
 * the total from `X-Total-Count` instead of loading a full page of episodes. Its cache entry still
 * sits under the episodes key, so watched/snooze updates adjust the count immediately.
 */
export function useSnoozedEpisodeCount() {
  return useEpisodesQuery({ snoozed: true, pageSize: 1 }).total;
}
