import { DateTime } from 'luxon';
import { isValidTimezone } from './overall';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type StatsParams = { from?: string; to?: string; timezone?: string };

/** Parses `from`, `to` (yyyy-MM-dd) and `tz` (IANA name) query params; returns an error message when invalid. */
export function parseStatsParams(search: URLSearchParams): { params: StatsParams } | { error: string } {
  const params: StatsParams = {};
  for (const key of ['from', 'to'] as const) {
    const value = search.get(key);
    if (value === null) continue;
    if (!ISO_DATE.test(value) || !DateTime.fromISO(value).isValid) return { error: `Invalid ${key}` };
    params[key] = value;
  }
  if (params.from && params.to && params.from > params.to) return { error: 'from must not be after to' };

  const tz = search.get('tz');
  if (tz !== null) {
    if (!isValidTimezone(tz)) return { error: 'Invalid tz' };
    params.timezone = tz;
  }
  return { params };
}
