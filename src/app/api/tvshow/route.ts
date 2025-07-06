import { db } from '@/lib/db';
import { tvshows, watcher_tvshows } from '@/lib/db/schema';
import { getTvShow } from '@/lib/themoviedb/tvshows';
import { createClient } from '@/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Start subscribing to a TV Show.
 */
export async function POST(request: NextRequest) {
  const { moviedb_id } = await request.json();
  if (!moviedb_id) {
    return NextResponse.json({ message: 'Missing ID' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let tvshow_id: number;
  const [existing] = await db.select().from(tvshows).where(eq(tvshows.moviedb_id, moviedb_id));
  if (existing) tvshow_id = existing.id;
  else {
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
      })
      .returning({ tvshow_id: tvshows.id });
    if (!inserted) {
      throw new Error(`Failed to insert show ${moviedb_id}`);
    }
    tvshow_id = inserted.tvshow_id;
  }

  await db.insert(watcher_tvshows).values({ watcher_id: data.user.id, tvshow_id });

  return NextResponse.json({ message: 'Success' }, { status: 201 });
}
