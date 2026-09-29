export type RateLimitClass = 'auth' | 'search' | 'api' | 'cron' | 'cronAuthed';

export type RateLimitPolicy = {
  class: RateLimitClass;
  max: number;
  windowMs: number;
};

/** Fixed per-route limits (in-memory per app instance). */
const POLICIES: Record<RateLimitClass, { max: number; windowMs: number }> = {
  auth: { max: 20, windowMs: 15 * 60 * 1000 },
  search: { max: 60, windowMs: 60 * 1000 },
  cron: { max: 10, windowMs: 60 * 60 * 1000 },
  cronAuthed: { max: 120, windowMs: 60 * 60 * 1000 },
  api: { max: 300, windowMs: 60 * 1000 },
};

export function getRateLimitPolicy(className: RateLimitClass): RateLimitPolicy {
  const limits = POLICIES[className];
  return { class: className, ...limits };
}

export function resolveRateLimitClass(pathname: string, authorization: string | null): RateLimitClass {
  if (pathname === '/api/refresh') {
    const secret = process.env.CRON_SECRET;
    if (secret && authorization === `Bearer ${secret}`) return 'cronAuthed';
    return 'cron';
  }
  if (pathname === '/api/auth/login' || pathname === '/api/auth/signup') return 'auth';
  if (pathname === '/api/movie/search' || pathname === '/api/tvshow/search') return 'search';
  if (pathname.startsWith('/api/')) return 'api';
  return 'api';
}
