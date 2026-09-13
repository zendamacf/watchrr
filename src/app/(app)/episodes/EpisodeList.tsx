'use client';

import { Alert, Center, Loader, Space, Stack, TextInput, Title } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useEpisodesQuery } from '@/hooks/useEpisodes';
import { DateFormat } from '@/utils/dates';
import { compareParsedEpisodes } from './compareParsedEpisodes';
import { GroupedEpisodes } from './GroupedEpisodes';
import { PastEpisodes } from './PastEpisodes';
import { parseEpisodeDate } from './parseEpisodeDate';
import type { ParsedEpisode } from './types';

export const EpisodeList = () => {
  const [search, setSearch] = useDebouncedState('', 200);

  const { isLoading, isError, data } = useEpisodesQuery();

  const { pastEpisodes, futureDates } = useMemo(() => {
    if (!data) return { pastEpisodes: [], futureDates: {} };
    const trimmedSearch = search.trim().toLowerCase();
    const converted = data
      .filter(
        (r) =>
          r.tvshows.name.toLowerCase().includes(trimmedSearch) || r.episodes.name.toLowerCase().includes(trimmedSearch),
      )
      .map<ParsedEpisode>((r) => {
        const delayDays = r.subscription.delay_days ?? 0;
        const snoozedUntil = r.subscription.snoozed_until;
        const isSnoozed =
          !!snoozedUntil && DateTime.fromSQL(snoozedUntil).startOf('day') >= DateTime.now().startOf('day');
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
            is_snoozed: isSnoozed,
            delay_days: delayDays,
            snoozed_until: snoozedUntil,
          },
        };
      });

    const scheduledEpisodes = converted.filter((r) => !r.episodes.is_snoozed);
    const pastEpisodes = scheduledEpisodes.filter((r) => r.episodes.in_past).sort(compareParsedEpisodes);
    const futureEpisodes = scheduledEpisodes.filter((r) => !r.episodes.in_past).sort(compareParsedEpisodes);
    const futureDates = futureEpisodes.reduce<Record<string, ParsedEpisode[]>>((acc, curr) => {
      const date = curr.episodes.local_date.toFormat(DateFormat.YMD);
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});

    return { pastEpisodes, futureDates };
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
      <TextInput
        placeholder={'Search'}
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      <Stack gap={'xl'}>
        {!!pastEpisodes.length && <PastEpisodes episodes={pastEpisodes} />}

        {Object.entries(futureDates)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, episodes]) => (
            <Stack gap={'sm'} key={date}>
              <Title order={2}>{DateTime.fromFormat(date, DateFormat.YMD).toFormat(DateFormat.DOW_DMY)}</Title>
              <GroupedEpisodes episodes={episodes} />
            </Stack>
          ))}
      </Stack>
    </>
  );
};
