import { type NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit/apply';

export function middleware(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
