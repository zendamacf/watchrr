'use client';

import { BackdropCard } from '@/components/BackdropCard';
import { useAlert } from '@/hooks/useAlert';
import { getImageUrl } from '@/lib/themoviedb/images';
import {
  ActionIcon,
  Badge,
  Group,
  Image,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Show } from './@types';

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
    <BackdropCard h={250} style={{ width: '100%' }} backdrop={show.backdrop_slug}>
      <Group h={'100%'} align={'center'}>
        <Image
          src={show.poster_slug ? getImageUrl(show.poster_slug) : undefined}
          fallbackSrc={'/placeholder.jpg'}
          alt={`Poster for ${show.name}`}
          flex={1}
          mah={'100%'}
          style={{ objectFit: 'contain' }}
        />
        <Stack h={'100%'} justify={'space-between'} flex={2}>
          <Stack gap={'xs'}>
            <Title order={3}>{show.name}</Title>
            <Popover width={'unset'}>
              <PopoverTarget>
                <Text c={'dimmed'} lineClamp={3}>
                  {show.description}
                </Text>
              </PopoverTarget>
              <PopoverDropdown>
                <Text>{show.description}</Text>
              </PopoverDropdown>
            </Popover>
          </Stack>
          <Group justify={'space-between'}>
            <Badge color={'blue'} variant={'outline'}>
              {show.country}
            </Badge>
            <ActionIcon
              color={'red'}
              loaderProps={{ type: 'dots' }}
              loading={isPending}
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
