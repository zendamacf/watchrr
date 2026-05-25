import { useMutation } from '@tanstack/react-query';
import { apiRoutes } from '@/lib/routes';
import { useAlert } from './useAlert';

export const useRefreshMovie = () => {
  const { showError, showLoading, doneLoadingSuccess, doneLoadingError } = useAlert();

  const { mutate: refresh, isPending: refreshPending } = useMutation<
    unknown,
    Error,
    { movieUuid: string; name: string },
    { notificationId: string }
  >({
    mutationFn: async ({ movieUuid }) => {
      const response = await fetch(apiRoutes.movieRefresh(movieUuid), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: ({ name }) => {
      const notificationId = showLoading({
        title: 'Working on it...',
        message: `We're refreshing everything for ${name}`,
      });
      return { notificationId };
    },
    onSuccess: (_data, { name }, { notificationId }) => {
      doneLoadingSuccess({
        title: 'All done!',
        message: `We've refreshed everything for ${name}`,
        id: notificationId,
      });
    },
    onError(error, _var, context) {
      if (context)
        doneLoadingError({
          title: 'An error occurred',
          message: error.message,
          id: context.notificationId,
        });
      else showError({ title: 'An error occurred', message: error.message });
    },
  });

  return { refresh, refreshPending };
};

export const useRefreshShow = () => {
  const { showError, showLoading, doneLoadingSuccess, doneLoadingError } = useAlert();

  const { mutate: refresh, isPending: refreshPending } = useMutation<
    unknown,
    Error,
    { tvshowUuid: string; name: string },
    { notificationId: string }
  >({
    mutationFn: async ({ tvshowUuid }) => {
      const response = await fetch(apiRoutes.tvshowRefresh(tvshowUuid), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: ({ name }) => {
      const notificationId = showLoading({
        title: 'Working on it...',
        message: `We're refreshing everything for ${name}`,
      });
      return { notificationId };
    },
    onSuccess: (_data, { name }, { notificationId }) => {
      doneLoadingSuccess({
        title: 'All done!',
        message: `We've refreshed everything for ${name}`,
        id: notificationId,
      });
    },
    onError(error, _var, context) {
      if (context)
        doneLoadingError({
          title: 'An error occurred',
          message: error.message,
          id: context.notificationId,
        });
      else showError({ title: 'An error occurred', message: error.message });
    },
  });

  return { refresh, refreshPending };
};
