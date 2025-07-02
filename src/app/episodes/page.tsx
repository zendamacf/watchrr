import { FormattedDate } from '@/components/Dates';
import { AuthedPage } from '@/components/Layout/AuthedPage';
import { db } from '@/lib/db';
import { episodes, tvshows, watcher_episodes } from '@/lib/db/schema';
import { Card, Flex, Stack, Text, Title } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import classNames from 'classnames';
import { getTimezonesForCountry } from 'countries-and-timezones';
import { and, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { Episode } from './@types';
import classes from './page.module.css';

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

  const converted = allEpisodes.map<Episode>((r) => {
    let localDate: DateTime;
    // Convert to user timezone
    const timezones = getTimezonesForCountry(r.tvshows.country);
    if (timezones?.length) {
      // Just get first, with dates we don't have to be too accurate
      const tz = timezones[0];
      // Convert from original timezone to user's
      const dt = DateTime.fromSQL(r.episodes.airdate, { zone: tz.name })
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
  const futureDates = futureEpisodes.reduce<Record<string, Episode[]>>((acc, curr) => {
    const iso = curr.episodes.local_date.toISO()!;
    if (!acc[iso]) acc[iso] = [];
    acc[iso].push(curr);
    return acc;
  }, {});

  return (
    <div>
      <Stack gap={'xl'}>
        <GroupedEpisodes episodes={pastEpisodes} showDates />

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

function GroupedEpisodes({ episodes, showDates }: { episodes: Episode[]; showDates?: boolean }) {
  return (
    <Flex wrap={'wrap'} gap={'md'}>
      {episodes.map((r) => (
        <EpisodeCard key={r.episodes.id} episode={r} showDate={showDates} />
      ))}
    </Flex>
  );
}

function EpisodeCard({ episode, showDate }: { episode: Episode; showDate?: boolean }) {
  const iso = episode.episodes.local_date.toISO()!;
  return (
    <Card key={episode.episodes.id} w={400} withBorder>
      <Title order={3} lineClamp={1}>
        {episode.tvshows.name}
      </Title>
      <Text
        fw={'bold'}
      >{`S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`}</Text>
      <Text>{episode.episodes.name}</Text>
      {showDate && (
        <Text className={classNames({ [classes.pastdate]: episode.episodes.in_past })}>
          <FormattedDate iso={iso} />
        </Text>
      )}
    </Card>
  );
}
