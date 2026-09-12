'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse } from '@/types';
import { isShowSnoozed } from '@/utils/episode-schedule';

export function useEpisodesQuery() {
  return useQuery<EpisodesResponse>({
    queryKey: [QueryKey.getEpisodes],
    queryFn: async () => {
      const response = await apiFetch(apiRoutes.episode, { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });
}

export function useSnoozedEpisodeCount() {
  const { data } = useEpisodesQuery();

  return useMemo(() => data?.filter((row) => isShowSnoozed(row.subscription.snoozed_until)).length ?? 0, [data]);
}
