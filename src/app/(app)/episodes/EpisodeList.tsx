'use client';

import { Alert, Center, Loader, Space, Stack, TextInput, Title } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { getTimezonesForCountry } from 'countries-and-timezones';
import { Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse } from '@/types';
import { DateFormat } from '@/utils/dates';
import { GroupedEpisodes } from './GroupedEpisodes';
import { PastEpisodes } from './PastEpisodes';
import type { ParsedEpisode } from './types';

export const EpisodeList = () => {
  const [search, setSearch] = useDebouncedState('', 200);

  const { isLoading, isError, data } = useQuery<EpisodesResponse>({
    queryKey: [QueryKey.getEpisodes],
    queryFn: async () => {
      const response = await apiFetch(apiRoutes.episode, { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });

  const { pastEpisodes, futureDates } = useMemo(() => {
    if (!data) return { pastEpisodes: [], futureDates: {} };
    const trimmedSearch = search.trim().toLowerCase();
    const converted = data
      .filter(
        (r) =>
          r.tvshows.name.toLowerCase().includes(trimmedSearch) || r.episodes.name.toLowerCase().includes(trimmedSearch),
      )
      .map<ParsedEpisode>((r) => {
        let localDate: DateTime;
        // Convert to user timezone
        const timezones = r.tvshows.country ? getTimezonesForCountry(r.tvshows.country) : [];
        if (timezones?.length) {
          // Just get first, with dates we don't have to be too accurate
          const [tz] = timezones;
          // Convert from original timezone to user's
          const dt = DateTime.fromSQL(r.episodes.airdate, { zone: tz?.name })
            // Hardcode at 8PM, as moviedb doesn't store airtimes
            .set({ hour: 20 })
            // TODO: Pull this from user config
            .setZone('Pacific/Auckland');
          localDate = dt;
        } else localDate = DateTime.fromSQL(r.episodes.airdate);
        const inPast = localDate.startOf('day') < DateTime.now().startOf('day');
        return { ...r, episodes: { ...r.episodes, local_date: localDate, in_past: inPast } };
      });

    const pastEpisodes = converted.filter((r) => r.episodes.in_past);
    const futureEpisodes = converted.filter((r) => !r.episodes.in_past);
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

        {Object.entries(futureDates).map(([date, episodes]) => (
          <Stack gap={'sm'} key={date}>
            <Title order={2}>{DateTime.fromFormat(date, DateFormat.YMD).toFormat(DateFormat.DOW_DMY)}</Title>
            <GroupedEpisodes episodes={episodes} />
          </Stack>
        ))}
      </Stack>
    </>
  );
};
