import { NextResponse } from 'next/server';
import { buildClearAuthCookie } from '@/lib/auth/cookies';

export async function POST() {
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': buildClearAuthCookie(),
      },
    },
  );
}
