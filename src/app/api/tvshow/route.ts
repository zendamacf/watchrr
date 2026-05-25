import { and, eq, exists } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribed_tvshows, tvshows } from '@/lib/db/schema';
import { getTvShow } from '@/lib/themoviedb/tvshows';
import { guardUser } from '@/utils/auth';

/**
 * Get all TV Shows currently subscribed to.
 */
export async function GET() {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const data = await db
    .select()
    .from(tvshows)
    .where(
      exists(
        db
          .select()
          .from(subscribed_tvshows)
          .where(and(eq(subscribed_tvshows.tvshow_uuid, tvshows.uuid), eq(subscribed_tvshows.watcher_id, user.id))),
      ),
    )
    .orderBy(tvshows.name);

  return NextResponse.json(data, { status: 200 });
}

/**
 * Start subscribing to a TV Show.
 */
export async function POST(request: NextRequest) {
  const { moviedb_id } = await request.json();
  if (!moviedb_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let show = (await db.select().from(tvshows).where(eq(tvshows.moviedb_id, moviedb_id)))[0];
  if (!show) {
    const found = await getTvShow(moviedb_id);
    if (!found) {
      return NextResponse.json({ message: 'Could not find show' }, { status: 404 });
    }

    const [inserted] = await db
      .insert(tvshows)
      .values({
        name: found.name,
        moviedb_id: found.id,
        country: found.country,
        poster_slug: found.poster,
        backdrop_slug: found.backdrop,
        description: found.description,
      })
      .onConflictDoNothing({ target: tvshows.moviedb_id })
      .returning();
    show = inserted ?? (await db.select().from(tvshows).where(eq(tvshows.moviedb_id, moviedb_id)))[0];
    if (!show) {
      throw new Error(`Failed to insert show ${moviedb_id}`);
    }
  }

  await db.insert(subscribed_tvshows).values({ watcher_id: user.id, tvshow_uuid: show.uuid }).onConflictDoNothing();

  return NextResponse.json({ message: 'Success', tvshow_uuid: show.uuid }, { status: 201 });
}
