import { type NextRequest, NextResponse } from 'next/server';
import { getRateLimitClientKey } from './client';
import { getRateLimitPolicy, resolveRateLimitClass } from './config';
import { consumeRateLimit } from './store';

/** Returns a 429 response when limited, or null to continue the request chain. */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) return null;

  const className = resolveRateLimitClass(pathname, request.headers.get('authorization'));
  const policy = getRateLimitPolicy(className);
  const clientKey = getRateLimitClientKey(request);
  const result = consumeRateLimit(clientKey, policy);

  if (!result.allowed) {
    return NextResponse.json(
      { message: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfterSeconds),
        },
      },
    );
  }

  return null;
}
