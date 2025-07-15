import { search } from '@/lib/themoviedb/movies';
import { guardUser } from '@/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query?.trim().length) return NextResponse.json([], { status: 200 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const data = await search(query);

  return NextResponse.json(data, { status: 200 });
}
