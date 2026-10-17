import { DateTime } from 'luxon';

/** Map a TMDB `YYYY-MM-DD` (or empty) value to an ISO string, or null when unknown. */
export const tmdbDateToIso = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const dt = DateTime.fromISO(value);
  if (!dt.isValid) return null;
  return dt.toISO();
};
