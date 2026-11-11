'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { MovieDetailResponse } from '@/types';

export function useMovieQuery(movieId: string) {
  return useQuery<MovieDetailResponse>({
    queryKey: [QueryKey.getMovie, movieId],
    queryFn: async () => {
      const response = await apiFetch(apiRoutes.movieById(movieId), { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });
}
