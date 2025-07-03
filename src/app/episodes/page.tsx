import { FormattedDate } from '@/components/Dates';
import { AuthedPage } from '@/components/Layout/AuthedPage';
import { db } from '@/lib/db';
import { episodes, tvshows, watcher_episodes } from '@/lib/db/schema';
import { Stack, Title } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import { getTimezonesForCountry } from 'countries-and-timezones';
import { and, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { ISOEpisode } from './@types';
import { GroupedEpisodes, PastEpisodes } from './components';

export default async function Episodes() {
  return <AuthedPage>{(props) => <EpisodeList {...props} />}</AuthedPage>;
}

async function EpisodeList({ user }: { user: User }) {
  const allEpisodes = await db
    .select()
    .from(episodes)
    .innerJoin(tvshows, eq(tvshows.id, episodes.tvshow_id))
    .innerJoin(
      watcher_episodes,
      and(eq(watcher_episodes.episode_id, episodes.id), eq(watcher_episodes.watcher_id, user.id)),
    )
    .where(eq(watcher_episodes.watched, false))
    .orderBy(episodes.airdate, tvshows.name, episodes.season, episodes.episode);

  const converted = allEpisodes.map<ISOEpisode>((r) => {
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

  return (
    <div>
      <Stack gap={'xl'}>
        {!!pastEpisodes.length && <PastEpisodes episodes={pastEpisodes} />}

        {Object.entries(futureDates).map(([iso, episodes]) => (
          <Stack gap={'sm'} key={iso}>
            <Title order={2}>
              <FormattedDate iso={iso} />
            </Title>
            <GroupedEpisodes episodes={episodes} />
          </Stack>
        ))}
      </Stack>
    </div>
  );
}
