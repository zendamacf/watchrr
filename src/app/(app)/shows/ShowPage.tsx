'use client';

import { Alert, Group, Select, Space, TextInput } from '@mantine/core';
import { useDebouncedState, useDisclosure } from '@mantine/hooks';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Search, Tv } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FloatingButton } from '@/components/FloatingButton';
import { InfiniteScrollSentinel } from '@/components/InfiniteScroll';
import { MediaGridSkeleton } from '@/components/MediaGridSkeleton';
import { QueryKey } from '@/components/QueryProvider';
import { flattenPages, pagedQueryOptions } from '@/lib/query/paged';
import { apiRoutes } from '@/lib/routes';
import type { ShowsResponse } from '@/types';
import {
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

  const { isLoading, isError, data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...pagedQueryOptions<ShowsResponse[number]>(QueryKey.getShows, apiRoutes.tvshow, {
      search: search.trim() || undefined,
      status: statusFilter === TV_SHOW_STATUS_FILTER_ALL ? undefined : statusFilter,
    }),
    placeholderData: keepPreviousData,
  });

  const filtered = !!search.trim() || statusFilter !== TV_SHOW_STATUS_FILTER_ALL;
  const shows = useMemo(() => flattenPages(data, (show) => show.id), [data]);

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
      {isLoading ? (
        <MediaGridSkeleton />
      ) : isError ? (
        <Alert color={'red'}>An error occurred</Alert>
      ) : (
        <>
          {shows.length ? (
            <ShowList shows={shows} />
          ) : filtered ? (
            <EmptyState
              icon={<Tv size={40} aria-hidden />}
              title="No shows match"
              description="Try a different search or status filter."
            />
          ) : (
            <EmptyState
              icon={<Tv size={40} aria-hidden />}
              title="No shows yet"
              description="Add a show to see its upcoming episodes on your schedule."
              action={{ label: 'Add a show', onClick: open }}
            />
          )}
          <InfiniteScrollSentinel
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            loadedCount={shows.length}
          />
        </>
      )}
      <FloatingButton onClick={open} />
    </>
  );
};
