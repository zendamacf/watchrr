import { NextResponse } from 'next/server';
import { consumeResetToken } from '@/lib/auth/password-reset';

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
    !('token' in body) ||
    !('password' in body) ||
    typeof body.token !== 'string' ||
    typeof body.password !== 'string' ||
    !body.token ||
    !body.password
  ) {
    return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
  }

  const ok = await consumeResetToken(body.token, body.password);
  if (!ok) {
    return NextResponse.json({ message: 'This reset link is invalid or has expired' }, { status: 400 });
  }

  // Intentionally does not sign the user in: they sign in with the new credentials.
  return NextResponse.json({ message: 'Password updated. Sign in with your new password.' }, { status: 200 });
}
