import { AuthedPage } from '@/components/Layout/AuthedPage';
import { db } from '@/lib/db';
import { tvshows, watcher_tvshows } from '@/lib/db/schema';
import { User } from '@supabase/supabase-js';
import { and, eq, exists } from 'drizzle-orm';
import { ShowList } from './ShowList';

export default async function Page() {
  return <AuthedPage>{(props) => <Inner {...props} />}</AuthedPage>;
}

async function Inner({ user }: { user: User }) {
  const data = await db
    .select()
    .from(tvshows)
    .where(
      exists(
        db
          .select()
          .from(watcher_tvshows)
          .where(
            and(eq(watcher_tvshows.tvshow_id, tvshows.id), eq(watcher_tvshows.watcher_id, user.id)),
          ),
      ),
    )
    .orderBy(tvshows.name);

  return <ShowList shows={data} />;
}
