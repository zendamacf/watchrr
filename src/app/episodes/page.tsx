import { AuthedPage } from '@/components/Layout/AuthedPage';
import { db } from '@/lib/db';
import { episodes, tvshows, watcher_episodes } from '@/lib/db/schema';
import { User } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';
import { EpisodeList } from './EpisodeList';

export default async function Episodes() {
  return <AuthedPage>{(props) => <Inner {...props} />}</AuthedPage>;
}

async function Inner({ user }: { user: User }) {
  const data = await db
    .select()
    .from(episodes)
    .innerJoin(tvshows, eq(tvshows.id, episodes.tvshow_id))
    .innerJoin(
      watcher_episodes,
      and(eq(watcher_episodes.episode_id, episodes.id), eq(watcher_episodes.watcher_id, user.id)),
    )
    .where(eq(watcher_episodes.watched, false))
    .orderBy(episodes.airdate, tvshows.name, episodes.season, episodes.episode);

  return <EpisodeList episodes={data} />;
}
