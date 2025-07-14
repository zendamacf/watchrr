import { useMutation } from '@tanstack/react-query';
import { useAlert } from './useAlert';

export const useRefreshMovie = () => {
  const { showError, showLoading, doneLoadingSuccess, doneLoadingError } = useAlert();

  const { mutate: refresh, isPending: refreshPending } = useMutation<
    unknown,
    Error,
    { movieId: number; name: string },
    { notificationId: string }
  >({
    mutationFn: async ({ movieId }) => {
      const response = await fetch(`/api/movie/${movieId}/refresh`, { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: ({ name }) => {
      const notificationId = showLoading(
        'Working on it...',
        `We're refreshing everything for ${name}`,
      );
      return { notificationId };
    },
    onSuccess: (_data, { name }, { notificationId }) => {
      doneLoadingSuccess('All done!', `We've refreshed everything for ${name}`, notificationId);
    },
    onError(error, _var, context) {
      if (context) doneLoadingError('An error occurred', error.message, context.notificationId);
      else showError('An error occurred', error.message);
    },
  });

  return { refresh, refreshPending };
};

export const useRefreshShow = () => {
  const { showError, showLoading, doneLoadingSuccess, doneLoadingError } = useAlert();

  const { mutate: refresh, isPending: refreshPending } = useMutation<
    unknown,
    Error,
    { tvshowId: number; name: string },
    { notificationId: string }
  >({
    mutationFn: async ({ tvshowId }) => {
      const response = await fetch(`/api/tvshow/${tvshowId}/refresh`, { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: ({ name }) => {
      const notificationId = showLoading(
        'Working on it...',
        `We're refreshing everything for ${name}`,
      );
      return { notificationId };
    },
    onSuccess: (_data, { name }, { notificationId }) => {
      doneLoadingSuccess('All done!', `We've refreshed everything for ${name}`, notificationId);
    },
    onError(error, _var, context) {
      if (context) doneLoadingError('An error occurred', error.message, context.notificationId);
      else showError('An error occurred', error.message);
    },
  });

  return { refresh, refreshPending };
};
