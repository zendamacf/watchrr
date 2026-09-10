'use client';

import { Alert, Anchor, Center, Loader, Space, Stack, TextInput, Title } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
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
import { parseEpisodeDate } from './parseEpisodeDate';
import { SnoozedEpisodes } from './SnoozedEpisodes';
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

  const { pastEpisodes, futureDates, snoozedEpisodes } = useMemo(() => {
    if (!data) return { pastEpisodes: [], futureDates: {}, snoozedEpisodes: [] };
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

    const snoozedEpisodes = converted.filter((r) => r.episodes.is_snoozed);
    const scheduledEpisodes = converted.filter((r) => !r.episodes.is_snoozed);
    const pastEpisodes = scheduledEpisodes.filter((r) => r.episodes.in_past);
    const futureEpisodes = scheduledEpisodes.filter((r) => !r.episodes.in_past);
    const futureDates = futureEpisodes.reduce<Record<string, ParsedEpisode[]>>((acc, curr) => {
      const date = curr.episodes.local_date.toFormat(DateFormat.YMD);
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});

    return { pastEpisodes, futureDates, snoozedEpisodes };
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
        {!!snoozedEpisodes.length && (
          <Alert
            color="orange"
            variant="light"
            title={`${snoozedEpisodes.length} episode${snoozedEpisodes.length === 1 ? '' : 's'} snoozed`}
          >
            These episodes are hidden from your schedule until their snooze ends.{' '}
            <Anchor href="#snoozed-episodes">View snoozed episodes</Anchor>
          </Alert>
        )}

        {!!snoozedEpisodes.length && <SnoozedEpisodes episodes={snoozedEpisodes} />}

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
