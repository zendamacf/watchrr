'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useRefreshShow } from '@/hooks/useRefresh';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';

export type AddMediaInput = { moviedb_id: number; name: string };

type Options = {
  /** Called after the item was added, for callers that also update their own lists. */
  onAdded?: (input: AddMediaInput) => void;
};

const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

/** Start following a movie by its TMDB id. */
export function useAddMovie({ onAdded }: Options = {}) {
  const { showSuccess, showError } = useAlert();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, AddMediaInput>({
    mutationFn: async (movie) => {
      const response = await apiFetch(apiRoutes.movie, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ moviedb_id: movie.moviedb_id }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, movie) => {
      showSuccess({ title: 'Nice!', message: `You're now following ${movie.name}` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMovies] });
      onAdded?.(movie);
    },
    onError(error) {
      showError({ title: 'An error occurred', message: error.message });
    },
  });
}

/** Start following a show by its TMDB id, then refresh it so its episodes load. */
export function useAddShow({ onAdded }: Options = {}) {
  const { showSuccess, showError } = useAlert();
  const { refresh } = useRefreshShow();
  const queryClient = useQueryClient();

  return useMutation<{ tvshowId: string }, Error, AddMediaInput>({
    mutationFn: async (tvshow) => {
      const response = await apiFetch(apiRoutes.tvshow, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ moviedb_id: tvshow.moviedb_id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      return { tvshowId: json.tvshow_id as string };
    },
    onSuccess: (data, tvshow) => {
      refresh({ tvshowId: data.tvshowId, name: tvshow.name });
      showSuccess({ title: 'Nice!', message: `You're now following ${tvshow.name}` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShows] });
      onAdded?.(tvshow);
    },
    onError(error) {
      showError({ title: 'An error occurred', message: error.message });
    },
  });
}
