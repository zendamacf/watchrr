import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { buildAuthCookie } from '@/lib/auth/cookies';
import { signAccessToken } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { db } from '@/lib/db';
import { lower, users } from '@/lib/db/schema';
import { isEmailEnabled } from '@/lib/email/config';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    !('password' in body) ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string'
  ) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(lower(users.email), email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
  }

  if (!user.emailVerifiedAt && isEmailEnabled()) {
    return NextResponse.json(
      { code: 'email_not_verified', message: 'Confirm your email address to sign in' },
      { status: 403 },
    );
  }

  const token = await signAccessToken(user.id, user.tokenVersion);

  return NextResponse.json(
    { token },
    {
      status: 200,
      headers: {
        'Set-Cookie': buildAuthCookie(token),
      },
    },
  );
}
