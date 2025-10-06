'use client';

import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useRefreshShow } from '@/hooks/useRefresh';
import { Show, ShowsResponse } from '@/types';
import { ActionIcon, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, X } from 'lucide-react';
import { BaseShowCard } from './BaseShowCard';

type Props = {
  show: Show;
};

type MutationContext = { previousShows: ShowsResponse | undefined };

export const ShowCard = ({ show }: Props) => {
  const { showError, showSuccess } = useAlert();

  const { refresh, refreshPending } = useRefreshShow();

  const queryClient = useQueryClient();
  const { mutate: remove, isPending: removePending } = useMutation<
    unknown,
    Error,
    number,
    MutationContext
  >({
    mutationFn: async (tvshow_id) => {
      const response = await fetch(`/api/tvshow/${tvshow_id}/`, { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (tvshow_id) => {
      // Cancel ongoing refetch to not overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: [QueryKey.getShows] });
      const previousShows = queryClient.getQueryData<ShowsResponse>([QueryKey.getShows]);
      queryClient.setQueryData<ShowsResponse>([QueryKey.getShows], (old) =>
        old?.filter((o) => o.id !== tvshow_id),
      );
      return { previousShows }; // Context for rollback
    },
    onSuccess: () => {
      showSuccess({ title: 'All done!', message: `You are no longer following ${show.name}` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShows] });
    },
    onError: (error, _vars, context) => {
      showError({ title: 'An error occurred', message: error.message });
      // Revert optimistic update
      queryClient.setQueryData([QueryKey.getShows], context?.previousShows);
    },
  });

  const confirmUnsubscribe = (tvshow_id: number) =>
    openConfirmModal({
      title: 'Are you sure?',
      children: <Text size="sm">Do you want to stop following {show.name}?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      centered: true,
      onConfirm: () => remove(tvshow_id),
    });

  return (
    <BaseShowCard
      h={250}
      show={show}
      actions={
        <>
          <ActionIcon
            color={'blue'}
            loading={refreshPending}
            onClick={() => refresh({ tvshowId: show.id, name: show.name })}
          >
            <RefreshCcw size={'20'} />
          </ActionIcon>
          <ActionIcon
            color={'red'}
            loading={removePending}
            onClick={() => confirmUnsubscribe(show.id)}
          >
            <X size={'20'} />
          </ActionIcon>
        </>
      }
    />
  );
};
