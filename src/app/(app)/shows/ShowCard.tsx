'use client';

import { ActionIcon, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, X } from 'lucide-react';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useRefreshShow } from '@/hooks/useRefresh';
import { apiRoutes } from '@/lib/routes';
import type { ShowPublic, ShowsResponse } from '@/types';
import { BaseShowCard } from './BaseShowCard';

type Props = {
  show: ShowPublic;
};

type MutationContext = { previousShows: ShowsResponse | undefined };

export const ShowCard = ({ show }: Props) => {
  const { showError, showSuccess } = useAlert();

  const { refresh, refreshPending } = useRefreshShow();

  const queryClient = useQueryClient();
  const { mutate: remove, isPending: removePending } = useMutation<unknown, Error, string, MutationContext>({
    mutationFn: async (tvshowUuid) => {
      const response = await fetch(apiRoutes.tvshowById(tvshowUuid), { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (tvshowUuid) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getShows] });
      const previousShows = queryClient.getQueryData<ShowsResponse>([QueryKey.getShows]);
      queryClient.setQueryData<ShowsResponse>([QueryKey.getShows], (old) => old?.filter((o) => o.uuid !== tvshowUuid));
      showSuccess({ title: 'All done!', message: `You are no longer following ${show.name}` });
      return { previousShows };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getShows] }),
    onError: (error, _vars, context) => {
      showError({ title: 'An error occurred', message: error.message });
      queryClient.setQueryData([QueryKey.getShows], context?.previousShows);
    },
  });

  const confirmUnsubscribe = (tvshowUuid: string) =>
    openConfirmModal({
      title: 'Are you sure?',
      children: <Text size="sm">Do you want to stop following {show.name}?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      centered: true,
      onConfirm: () => remove(tvshowUuid),
    });

  return (
    <BaseShowCard
      h={250}
      show={show}
      actions={
        <>
          <ActionIcon
            aria-label="Refresh metadata"
            color={'blue'}
            loading={refreshPending}
            onClick={() => refresh({ tvshowUuid: show.uuid, name: show.name })}
          >
            <RefreshCcw size={'20'} />
          </ActionIcon>
          <ActionIcon
            aria-label="Unsubscribe"
            color={'red'}
            loading={removePending}
            onClick={() => confirmUnsubscribe(show.uuid)}
          >
            <X size={'20'} />
          </ActionIcon>
        </>
      }
    />
  );
};
