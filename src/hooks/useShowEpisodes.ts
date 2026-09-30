'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { ShowEpisodesResponse } from '@/types';

export function useShowEpisodesQuery(tvshowId: string) {
  return useQuery<ShowEpisodesResponse>({
    queryKey: [QueryKey.getShowEpisodes, tvshowId],
    queryFn: async () => {
      const response = await apiFetch(apiRoutes.tvshowEpisodes(tvshowId), { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });
}
