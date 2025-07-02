import { FormattedDate } from '@/components/Dates';
import { AuthedPage } from '@/components/Layout/AuthedPage';
import { db } from '@/lib/db';
import { episodes, tvshows, watcher_episodes } from '@/lib/db/schema';
import { Card, Flex, Stack, Text, Title } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import { getTimezonesForCountry } from 'countries-and-timezones';
import { and, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { Episode } from './@types';

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

  return (
    <div>
      <Stack gap={16}>
        <Flex wrap={'wrap'} gap={8}>
          {pastEpisodes.map((r) => (
            <EpisodeCard key={r.episodes.id} episode={r} />
          ))}
        </Flex>

        <Flex wrap={'wrap'} gap={8}>
          {futureEpisodes.map((r) => (
            <EpisodeCard key={r.episodes.id} episode={r} />
          ))}
        </Flex>
      </Stack>
    </div>
  );
}

function EpisodeCard({ episode }: { episode: Episode }) {
  const iso = episode.episodes.local_date.toISO()!;
  return (
    <Card key={episode.episodes.id} w={400}>
      <Title order={3} lineClamp={1}>
        {episode.tvshows.name}
      </Title>
      <Flex gap={8}>
        <Text
          fw={'bold'}
        >{`S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`}</Text>
        <Text>{episode.episodes.name}</Text>
      </Flex>
      <Text c={episode.episodes.in_past ? 'var(--warning)' : undefined}>
        <FormattedDate iso={iso} />
      </Text>
    </Card>
  );
}
