import { and, asc, eq, exists } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/db/resolve-id';
import { episodes, subscribed_tvshows, tvshows, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * List all episodes for a subscribed show, including watched state.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const tvshowIdParam = (await params).tvshow_id;
  if (!isUuid(tvshowIdParam)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const [showRow] = await db
    .select({
      tvshow: tvshows,
      subscription: {
        delay_days: subscribed_tvshows.delay_days,
        snoozed_until: subscribed_tvshows.snoozed_until,
      },
    })
    .from(tvshows)
    .innerJoin(
      subscribed_tvshows,
      and(eq(subscribed_tvshows.tvshow_id, tvshows.id), eq(subscribed_tvshows.watcher_id, user.id)),
    )
    .where(eq(tvshows.id, tvshowIdParam))
    .limit(1);

  if (!showRow) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const rows = await db
    .select({
      episode: episodes,
      watched: exists(
        db
          .select()
          .from(watched_episodes)
          .where(and(eq(watched_episodes.episode_id, episodes.id), eq(watched_episodes.watcher_id, user.id))),
      ),
    })
    .from(episodes)
    .where(eq(episodes.tvshow_id, tvshowIdParam))
    .orderBy(asc(episodes.season), asc(episodes.episode));

  return NextResponse.json(
    {
      tvshow: showRow.tvshow,
      subscription: showRow.subscription,
      episodes: rows.map(({ episode, watched }) => ({ ...episode, watched: !!watched })),
    },
    { status: 200 },
  );
}
