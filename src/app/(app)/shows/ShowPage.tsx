'use client';

import { Alert, Center, Group, Loader, Select, Space, TextInput } from '@mantine/core';
import { useDebouncedState, useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FloatingButton } from '@/components/FloatingButton';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { ShowsResponse } from '@/types';
import {
  showMatchesStatusFilter,
  TV_SHOW_STATUS_FILTER_ALL,
  TV_SHOW_STATUS_FILTER_OPTIONS,
  type TvShowStatusFilter,
} from '@/utils/tvshowStatus';
import { AddShowModal } from './AddShowModal';
import { ShowList } from './ShowList';

export const ShowPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useDebouncedState('', 200);
  const [statusFilter, setStatusFilter] = useState<TvShowStatusFilter>(TV_SHOW_STATUS_FILTER_ALL);

  const { isLoading, isError, data } = useQuery<ShowsResponse>({
    queryKey: [QueryKey.getShows],
    queryFn: async () => {
      const response = await apiFetch(apiRoutes.tvshow, { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });

  const shows = useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    return data?.filter((show) => {
      if (!showMatchesStatusFilter(show, statusFilter)) return false;
      if (!trimmedSearch) return true;
      return show.name.toLowerCase().includes(trimmedSearch) || show.description?.toLowerCase().includes(trimmedSearch);
    });
  }, [search, data, statusFilter]);

  if (isLoading)
    return (
      <Center>
        <Loader />
      </Center>
    );
  if (isError) return <Alert color={'red'}>An error occurred</Alert>;

  return (
    <>
      <AddShowModal opened={opened} onClose={close} size={'xl'} />
      <Group align="flex-end" wrap="wrap" gap="md">
        <TextInput
          placeholder={'Search'}
          defaultValue={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          leftSection={<Search />}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          label="Status"
          aria-label="Filter by show status"
          data={TV_SHOW_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter((value as TvShowStatusFilter | null) ?? TV_SHOW_STATUS_FILTER_ALL)}
          allowDeselect={false}
          w={{ base: '100%', sm: 220 }}
        />
      </Group>
      <Space h={'md'} />
      <ShowList shows={shows ?? []} />
      <FloatingButton onClick={open} />
    </>
  );
};
