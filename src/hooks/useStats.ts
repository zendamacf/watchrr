'use client';

import { type QueryClient, useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { OverallStats, ShowStats } from '@/lib/stats/types';

function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { method: 'get' });
  if (response.ok) return await response.json();
  throw new Error((await response.json()).message);
}

export function useStatsQuery(range?: { from?: string; to?: string }) {
  const timezone = browserTimezone();
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  if (timezone) params.set('tz', timezone);

  return useQuery<OverallStats>({
    queryKey: [QueryKey.getStats, range?.from, range?.to, timezone],
    queryFn: () => fetchJson<OverallStats>(apiRoutes.stats(params)),
  });
}

export function useShowStatsQuery(tvshowId: string) {
  const timezone = browserTimezone();
  const params = new URLSearchParams();
  if (timezone) params.set('tz', timezone);

  return useQuery<ShowStats>({
    queryKey: [QueryKey.getShowStats, tvshowId, timezone],
    queryFn: () => fetchJson<ShowStats>(apiRoutes.tvshowStats(tvshowId, params)),
  });
}

/** Call after anything that changes what the user has watched. */
export function invalidateStats(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: [QueryKey.getStats] });
  queryClient.invalidateQueries({ queryKey: [QueryKey.getShowStats] });
}
