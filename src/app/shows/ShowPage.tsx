'use client';

import { Show } from '@/types';
import { ActionIcon, Affix, Alert, Center, Loader, Space, TextInput } from '@mantine/core';
import { useDebouncedState, useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { AddShowModal } from './AddShowModal';
import { ShowList } from './ShowList';

export const ShowPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useDebouncedState('', 200);

  const { isLoading, isError, data, refetch } = useQuery<Show[]>({
    queryKey: ['getShows'],
    queryFn: async () => {
      const response = await fetch('/api/tvshow', { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });

  const shows = useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    return trimmedSearch
      ? data?.filter(
          (d) =>
            d.name.toLowerCase().includes(trimmedSearch) ||
            d.description?.toLowerCase().includes(trimmedSearch),
        )
      : data;
  }, [search, data]);

  if (isLoading)
    return (
      <Center>
        <Loader />
      </Center>
    );
  if (isError) return <Alert color={'red'}>An error occurred</Alert>;

  return (
    <>
      <AddShowModal opened={opened} onAdd={() => refetch()} onClose={close} size={'xl'} />
      <TextInput
        placeholder={'Search'}
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      <ShowList shows={shows ?? []} onRemove={() => refetch()} />
      <Affix position={{ bottom: 30, right: 30 }}>
        <ActionIcon radius="xl" size={60} onClick={open}>
          <Plus size={30} />
        </ActionIcon>
      </Affix>
    </>
  );
};
