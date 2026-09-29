import { type NextRequest, NextResponse } from 'next/server';
import { getRateLimitClientKey } from '@/lib/rate-limit/client';
import { getRateLimitPolicy, isRateLimitEnabled, resolveRateLimitClass } from '@/lib/rate-limit/config';
import { consumeRateLimit } from '@/lib/rate-limit/store';

export function middleware(request: NextRequest) {
  if (!isRateLimitEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
