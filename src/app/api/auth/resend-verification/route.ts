import { NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/auth/email';
import { createVerificationToken, VERIFICATION_TOKEN_TTL_MINUTES } from '@/lib/auth/email-verification';
import { getAppUrl, isEmailEnabled } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send';
import { routes } from '@/lib/routes';

const GENERIC_MESSAGE = 'If that account needs confirming, a new link is on its way.';

export async function POST(request: Request) {
  if (!isEmailEnabled()) {
    return NextResponse.json({ message: 'Email verification is not enabled on this instance' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !('email' in body) || typeof body.email !== 'string') {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  const token = await createVerificationToken(email);
  if (token) {
    // Not awaited: response time must not reveal whether the account exists. sendEmail never throws.
    void sendEmail('verifyEmail', email, {
      verifyUrl: `${getAppUrl()}${routes.verifyEmail}?token=${encodeURIComponent(token)}`,
      expiresInHours: VERIFICATION_TOKEN_TTL_MINUTES / 60,
    });
  }

  // Same response whether or not the account exists or is already verified.
  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
}
