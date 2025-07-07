'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { useAlert } from '@/hooks/useAlert';
import { Badge, Button, Group, Stack, Text, Title } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Show } from './@types';

type Props = {
  show: Show;
  removeShow: (tvshow_id: number) => void;
};

export const ShowCard = ({ show, removeShow }: Props) => {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useAlert();

  async function unsubscribe(tvshow_id: number) {
    setLoading(true);
    const response = await fetch(`/api/tvshow/${tvshow_id}/`, { method: 'delete' });
    if (response.ok) {
      await removeShow(tvshow_id);
      showSuccess('All done!', `You are no longer following ${show.name}`);
    } else {
      showError('An error occurred', (await response.json()).message);
    }
    setLoading(false);
  }

  const confirmUnsubscribe = (tvshow_id: number) =>
    openConfirmModal({
      title: 'Are you sure?',
      children: <Text size="sm">Do you want to stop following {show.name}?</Text>,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => unsubscribe(tvshow_id),
    });

  return (
    <BackdropCard
      h={250}
      w={400}
      style={{
        flexGrow: 1,
      }}
      backdrop={show.backdrop_slug}
    >
      <Stack h={'100%'} justify={'space-between'}>
        <Group justify={'space-between'}>
          <Title order={3}>{show.name}</Title>
          <Badge color={'blue'} variant={'outline'}>
            {show.country}
          </Badge>
        </Group>
        <Text c={'dimmed'} lineClamp={6}>
          {show.description}
        </Text>
        <Group justify={'end'}>
          <Button
            color={'red'}
            leftSection={<X />}
            loaderProps={{ type: 'dots' }}
            loading={loading}
            onClick={() => confirmUnsubscribe(show.id)}
          >
            Remove
          </Button>
        </Group>
      </Stack>
    </BackdropCard>
  );
};
