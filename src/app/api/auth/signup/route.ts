import { db } from '@/lib/db';
import { lower, users } from '@/lib/db/schema';
import { buildAuthCookie } from '@/lib/auth/cookies';
import { signAccessToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

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

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(lower(users.email), email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id });

  if (!user) {
    return NextResponse.json({ message: 'Failed to create account' }, { status: 500 });
  }

  const token = await signAccessToken(user.id);

  return NextResponse.json(
    { token },
    {
      status: 201,
      headers: {
        'Set-Cookie': buildAuthCookie(token),
      },
    },
  );
}
