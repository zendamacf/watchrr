'use client';

import { useAlert } from '@/hooks/useAlert';
import { Show } from '@/types';
import { ActionIcon, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { BaseShowCard } from './BaseShowCard';

type Props = {
  show: Show;
  onRemove: (tvshow_id: number) => void;
};

export const ShowCard = ({ show, onRemove }: Props) => {
  const { showError, showSuccess } = useAlert();

  const { mutate, isPending } = useMutation<unknown, Error, number>({
    mutationFn: async (tvshow_id) => {
      const response = await fetch(`/api/tvshow/${tvshow_id}/`, { method: 'delete' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onSuccess: (_data, tvshow_id) => {
      onRemove(tvshow_id);
      showSuccess('All done!', `You are no longer following ${show.name}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  const confirmUnsubscribe = (tvshow_id: number) =>
    openConfirmModal({
      title: 'Are you sure?',
      children: <Text size="sm">Do you want to stop following {show.name}?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      centered: true,
      onConfirm: () => mutate(tvshow_id),
    });

  return (
    <BaseShowCard
      h={250}
      show={show}
      actions={
        <ActionIcon
          color={'red'}
          loaderProps={{ type: 'dots' }}
          loading={isPending}
          onClick={() => confirmUnsubscribe(show.id)}
        >
          <X />
        </ActionIcon>
      }
    />
  );
};
