'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { useAlert } from '@/hooks/useAlert';
import { getImageUrl } from '@/lib/themoviedb/images';
import { ActionIcon, Badge, Group, Image, Stack, Text, Title } from '@mantine/core';
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
      style={{
        width: '100%',
      }}
      backdrop={show.backdrop_slug}
    >
      <Group mah={'100%'} align={'start'}>
        <Image
          src={show.poster_slug ? getImageUrl(show.poster_slug) : undefined}
          fallbackSrc={'/placeholder.jpg'}
          alt={`Poster for ${show.name}`}
          flex={1}
          mah={'100%'}
          style={{ objectFit: 'contain' }}
        />
        <Stack h={'100%'} justify={'space-between'} flex={2}>
          <Title order={3}>{show.name}</Title>
          <Text c={'dimmed'} lineClamp={3}>
            {show.description}
          </Text>
          <Group justify={'space-between'}>
            <Badge color={'blue'} variant={'outline'}>
              {show.country}
            </Badge>
            <ActionIcon
              color={'red'}
              loaderProps={{ type: 'dots' }}
              loading={loading}
              onClick={() => confirmUnsubscribe(show.id)}
            >
              <X />
            </ActionIcon>
          </Group>
        </Stack>
      </Group>
    </BackdropCard>
  );
};
