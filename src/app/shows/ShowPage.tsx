'use client';

import { ActionIcon, Affix, Alert, Center, Loader, Space } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Show } from './@types';
import { ShowList } from './ShowList';

export const ShowPage = ({ user }: { user: User }) => {
  const { isLoading, isError, data, refetch } = useQuery<Show[]>({
    queryKey: ['getShows'],
    queryFn: async () => {
      const response = await fetch('/api/tvshow', { method: 'get' });
      if (response.ok) {
        return await response.json();
      }
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
      <ShowList shows={data ?? []} onRemove={() => refetch()} />
      <Affix position={{ bottom: 30, right: 30 }}>
        <ActionIcon radius="xl" size={60}>
          <Plus size={30} />
        </ActionIcon>
      </Affix>
      <Space style={{ height: '100px' }} />
    </>
  );
};
