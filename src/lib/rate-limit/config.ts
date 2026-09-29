export type RateLimitClass = 'auth' | 'search' | 'api' | 'cron' | 'cronAuthed';

export type RateLimitPolicy = {
  class: RateLimitClass;
  max: number;
  windowMs: number;
};

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export function isRateLimitEnabled(): boolean {
  const raw = process.env.RATE_LIMIT_ENABLED;
  if (raw === undefined || raw.trim() === '') return true;
  return !['false', '0', 'no', 'off'].includes(raw.trim().toLowerCase());
}

export function getRateLimitPolicy(className: RateLimitClass): RateLimitPolicy {
  switch (className) {
    case 'auth':
      return {
        class: 'auth',
        max: readPositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 20),
        windowMs: readPositiveInt(process.env.RATE_LIMIT_AUTH_WINDOW_SEC, 900) * 1000,
      };
    case 'search':
      return {
        class: 'search',
        max: readPositiveInt(process.env.RATE_LIMIT_SEARCH_MAX, 60),
        windowMs: readPositiveInt(process.env.RATE_LIMIT_SEARCH_WINDOW_SEC, 60) * 1000,
      };
    case 'cron':
      return {
        class: 'cron',
        max: readPositiveInt(process.env.RATE_LIMIT_CRON_MAX, 10),
        windowMs: readPositiveInt(process.env.RATE_LIMIT_CRON_WINDOW_SEC, 3600) * 1000,
      };
    case 'cronAuthed':
      return {
        class: 'cronAuthed',
        max: readPositiveInt(process.env.RATE_LIMIT_CRON_AUTH_MAX, 120),
        windowMs: readPositiveInt(process.env.RATE_LIMIT_CRON_AUTH_WINDOW_SEC, 3600) * 1000,
      };
    default:
      return {
        class: 'api',
        max: readPositiveInt(process.env.RATE_LIMIT_API_MAX, 300),
        windowMs: readPositiveInt(process.env.RATE_LIMIT_API_WINDOW_SEC, 60) * 1000,
      };
  }
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
