'use client';

import { Alert, Space, Stack, Text, TextInput, Title } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { CalendarCheck, Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { InfiniteScrollSentinel } from '@/components/InfiniteScroll';
import { EpisodeGridSkeleton } from '@/components/MediaGridSkeleton';
import { useEpisodesQuery } from '@/hooks/useEpisodes';
import { DateFormat } from '@/utils/dates';
import { compareParsedEpisodes } from './compareParsedEpisodes';
import classes from './EpisodeList.module.css';
import { GroupedEpisodes } from './GroupedEpisodes';
import { PastEpisodes } from './PastEpisodes';
import { parseEpisodeDate } from './parseEpisodeDate';
import type { ParsedEpisode } from './types';

const relativeDayLabel = (day: DateTime) => {
  const today = DateTime.now().startOf('day');
  if (day.hasSame(today, 'day')) return 'Today';
  if (day.hasSame(today.plus({ days: 1 }), 'day')) return 'Tomorrow';
  return null;
};

export const EpisodeList = () => {
  const [search, setSearch] = useDebouncedState('', 200);

  const { isLoading, isError, episodes, hasNextPage, isFetchingNextPage, fetchNextPage } = useEpisodesQuery({
    search,
    snoozed: false,
  });

  const { pastEpisodes, futureDates } = useMemo(() => {
    const converted = episodes.map<ParsedEpisode>((r) => {
      const delayDays = r.subscription.delay_days ?? 0;
      const snoozedUntil = r.subscription.snoozed_until;
      const { originalLocalDate, effectiveLocalDate, inPast } = parseEpisodeDate(
        r.episodes.airdate,
        r.tvshows.country,
        delayDays,
      );

      return {
        ...r,
        episodes: {
          ...r.episodes,
          local_date: effectiveLocalDate,
          original_local_date: originalLocalDate,
          in_past: inPast,
          delay_days: delayDays,
          snoozed_until: snoozedUntil,
        },
      };
    });

    const pastEpisodes = converted.filter((r) => r.episodes.in_past).sort(compareParsedEpisodes);
    const futureEpisodes = converted.filter((r) => !r.episodes.in_past).sort(compareParsedEpisodes);
    const futureDates = futureEpisodes.reduce<Record<string, ParsedEpisode[]>>((acc, curr) => {
      const date = curr.episodes.local_date.toFormat(DateFormat.YMD);
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});

    return { pastEpisodes, futureDates };
  }, [episodes]);

  return (
    <>
      <TextInput
        placeholder={'Search'}
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      {isLoading ? (
        <EpisodeGridSkeleton />
      ) : isError ? (
        <Alert color={'red'}>An error occurred</Alert>
      ) : (
        <>
          <Stack gap={'xl'}>
            {!!pastEpisodes.length && (
              <PastEpisodes episodes={pastEpisodes} hasMore={hasNextPage && !Object.keys(futureDates).length} />
            )}

            {Object.entries(futureDates)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, episodes], index) => {
                const day = DateTime.fromFormat(date, DateFormat.YMD);
                const relative = relativeDayLabel(day);
                return (
                  <Stack
                    gap={'sm'}
                    key={date}
                    className={classes.day}
                    style={{ '--reveal-delay': `${Math.min(index, 6) * 60}ms` }}
                  >
                    <Title order={2}>
                      {relative && (
                        <>
                          {relative}{' '}
                          <Text span c="dimmed" fw={500} fz="md">
                            {day.toFormat(DateFormat.DOW_DMY)}
                          </Text>
                        </>
                      )}
                      {!relative && day.toFormat(DateFormat.DOW_DMY)}
                    </Title>
                    <GroupedEpisodes episodes={episodes} />
                  </Stack>
                );
              })}
            {!pastEpisodes.length && !Object.keys(futureDates).length && (
              <EmptyState
                icon={<CalendarCheck size={40} aria-hidden />}
                title={search.trim() ? 'No episodes match' : "You're all caught up"}
                description={
                  search.trim()
                    ? 'Try a different search.'
                    : 'New episodes from the shows you follow will appear here when they air.'
                }
              />
            )}
          </Stack>
          <InfiniteScrollSentinel
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            loadedCount={episodes.length}
          />
        </>
      )}
    </>
  );
};
