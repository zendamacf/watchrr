import { type NextRequest, NextResponse } from 'next/server';
import { isProtectedApiPath, isProtectedPagePath } from '@/lib/auth/middleware-config';
import { authenticateHeaders } from '@/lib/auth/session';
import { applyRateLimit } from '@/lib/rate-limit/apply';
import { routes } from '@/lib/routes';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    const limited = applyRateLimit(request);
    if (limited) return limited;

    if (isProtectedApiPath(pathname)) {
      const session = await authenticateHeaders(request.headers);
      if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.next();
  }

  if (isProtectedPagePath(pathname)) {
    const session = await authenticateHeaders(request.headers);
    if (!session) {
      return NextResponse.redirect(new URL(routes.signin, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on app pages and API routes. Skip Next.js internals and common static files.
     * See src/lib/auth/middleware-config.ts for public vs protected path rules.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
