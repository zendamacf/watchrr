'use client';

import { Episode, Show } from '@/types';
import { DateFormat } from '@/utils/dates';
import { Alert, Center, Loader, Stack, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getTimezonesForCountry } from 'countries-and-timezones';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { GroupedEpisodes } from './GroupedEpisodes';
import { PastEpisodes } from './PastEpisodes';
import { ParsedEpisode } from './types';

export const EpisodeList = () => {
  const { isLoading, isError, data, refetch } = useQuery<
    {
      episodes: Episode;
      tvshows: Show;
    }[]
  >({
    queryKey: ['getEpisodes'],
    queryFn: async () => {
      const response = await fetch('/api/episode', { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
  });

  const { pastEpisodes, futureDates } = useMemo(() => {
    if (!data) return { pastEpisodes: [], futureDates: {} };
    const converted = data.map<ParsedEpisode>((r) => {
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
      const inPast = localDate < DateTime.now();
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
  }, [data]);

  if (isLoading)
    return (
      <Center>
        <Loader type={'dots'} />
      </Center>
    );
  if (isError) return <Alert color={'red'}>An error occurred</Alert>;

  return (
    <Stack gap={'xl'}>
      {!!pastEpisodes.length && <PastEpisodes episodes={pastEpisodes} onRemove={() => refetch()} />}

      {Object.entries(futureDates).map(([date, episodes]) => (
        <Stack gap={'sm'} key={date}>
          <Title order={2}>
            {DateTime.fromFormat(date, DateFormat.YMD).toFormat(DateFormat.DOW_DMY)}
          </Title>
          <GroupedEpisodes episodes={episodes} onRemove={() => refetch()} />
        </Stack>
      ))}
    </Stack>
  );
};
