import { NextResponse } from 'next/server';
import { createResetToken, RESET_TOKEN_TTL_MINUTES } from '@/lib/auth/password-reset';
import { canDeliverEmail, getAppUrl } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send';
import { routes } from '@/lib/routes';

const GENERIC_MESSAGE = 'If an account exists for that email, a reset link is on its way.';

export async function POST(request: Request) {
  if (!canDeliverEmail()) {
    return NextResponse.json({ message: 'Password reset by email is not available on this instance' }, { status: 503 });
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
  const email = body.email.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  const token = await createResetToken(email);
  if (token) {
    // Not awaited: response time must not reveal whether the account exists. sendEmail never throws.
    void sendEmail('passwordReset', email, {
      resetUrl: `${getAppUrl()}${routes.resetPassword}?token=${encodeURIComponent(token)}`,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });
  }

  // Same response whether or not the account exists.
  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
}
