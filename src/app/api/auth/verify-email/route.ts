import { NextResponse } from 'next/server';
import { consumeVerificationToken } from '@/lib/auth/email-verification';

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
    typeof body.token !== 'string' ||
    !body.token
  ) {
    return NextResponse.json({ message: 'Token is required' }, { status: 400 });
  }

  if (!(await consumeVerificationToken(body.token))) {
    return NextResponse.json({ message: 'This verification link is invalid or has expired' }, { status: 400 });
  }

  // Intentionally does not sign the user in: they sign in with their credentials.
  return NextResponse.json({ message: 'Email confirmed. You can now sign in.' }, { status: 200 });
}
