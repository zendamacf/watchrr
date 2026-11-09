import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { buildAuthCookie } from '@/lib/auth/cookies';
import { INVALID_EMAIL_MESSAGE, isValidEmail, normalizeEmail } from '@/lib/auth/email';
import { issueVerificationToken, VERIFICATION_TOKEN_TTL_MINUTES } from '@/lib/auth/email-verification';
import { signAccessToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { isSignupEnabled } from '@/lib/auth/signup';
import { db } from '@/lib/db';
import { lower, users } from '@/lib/db/schema';
import { getAppUrl, isEmailEnabled } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send';
import { routes } from '@/lib/routes';

export async function POST(request: Request) {
  if (!isSignupEnabled()) {
    return NextResponse.json({ message: 'New user registration is disabled' }, { status: 403 });
  }
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

  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: INVALID_EMAIL_MESSAGE }, { status: 400 });
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

  // Without email configured we can't verify anyone, so accounts are trusted as before.
  const requiresVerification = isEmailEnabled();

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, emailVerifiedAt: requiresVerification ? null : new Date() })
    .returning({ id: users.id, tokenVersion: users.tokenVersion });

  if (!user) {
    return NextResponse.json({ message: 'Failed to create account' }, { status: 500 });
  }

  if (requiresVerification) {
    const verifyToken = await issueVerificationToken(user.id);
    // sendEmail never throws; the user can request another link if delivery fails.
    await sendEmail('verifyEmail', email, {
      verifyUrl: `${getAppUrl()}${routes.verifyEmail}?token=${encodeURIComponent(verifyToken)}`,
      expiresInHours: VERIFICATION_TOKEN_TTL_MINUTES / 60,
    });
    return NextResponse.json({ requiresVerification: true }, { status: 201 });
  }

  const token = await signAccessToken(user.id, user.tokenVersion);

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
