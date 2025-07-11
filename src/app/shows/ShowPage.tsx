'use client';

import { Show } from '@/types';
import { ActionIcon, Affix, Alert, Center, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { AddShowModal } from './AddShowModal';
import { ShowList } from './ShowList';

export const ShowPage = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const { isLoading, isError, data, refetch } = useQuery<Show[]>({
    queryKey: ['getShows'],
    queryFn: async () => {
      const response = await fetch('/api/tvshow', { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });

  if (isLoading)
    return (
      <Center>
        <Loader type={'dots'} />
      </Center>
    );
  if (isError) return <Alert color={'red'}>An error occurred</Alert>;

  return (
    <>
      <AddShowModal opened={opened} onAdd={() => refetch()} onClose={close} size={'xl'} />
      <ShowList shows={data ?? []} onRemove={() => refetch()} />
      <Affix position={{ bottom: 30, right: 30 }}>
        <ActionIcon radius="xl" size={60} onClick={open}>
          <Plus size={30} />
        </ActionIcon>
      </Affix>
    </>
  );
};
