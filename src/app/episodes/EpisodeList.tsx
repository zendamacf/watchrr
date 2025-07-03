'use client';

import { FormattedDate } from '@/components/Dates';
import { Stack, Title } from '@mantine/core';
import { getTimezonesForCountry } from 'countries-and-timezones';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { Episode, ISOEpisode } from './@types';
import { GroupedEpisodes } from './GroupedEpisodes';
import { PastEpisodes } from './PastEpisodes';

type Props = { episodes: Episode[] };

export const EpisodeList = (props: Props) => {
  const [episodes, setEpisodes] = useState<Episode[]>(props.episodes);

  const converted = episodes.map<ISOEpisode>((r) => {
    let localDate: DateTime;
    // Convert to user timezone
    const timezones = getTimezonesForCountry(r.tvshows.country);
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
    return { ...r, episodes: { ...r.episodes, local_date: localDate.toISO()!, in_past: inPast } };
  });

  const pastEpisodes = converted.filter((r) => r.episodes.in_past);
  const futureEpisodes = converted.filter((r) => !r.episodes.in_past);
  const futureDates = futureEpisodes.reduce<Record<string, ISOEpisode[]>>((acc, curr) => {
    const iso = curr.episodes.local_date;
    if (!acc[iso]) acc[iso] = [];
    acc[iso].push(curr);
    return acc;
  }, {});

  function removeEpisode(episode_id: number) {
    setEpisodes(episodes.filter((e) => e.episodes.id !== episode_id));
  }

  return (
    <div>
      <Stack gap={'xl'}>
        {!!pastEpisodes.length && (
          <PastEpisodes episodes={pastEpisodes} removeEpisode={removeEpisode} />
        )}

        {Object.entries(futureDates).map(([iso, episodes]) => (
          <Stack gap={'sm'} key={iso}>
            <Title order={2}>
              <FormattedDate iso={iso} />
            </Title>
            <GroupedEpisodes episodes={episodes} removeEpisode={removeEpisode} />
          </Stack>
        ))}
      </Stack>
    </div>
  );
};
