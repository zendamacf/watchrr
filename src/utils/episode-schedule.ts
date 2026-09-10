import { DateTime } from 'luxon';

export const MAX_DELAY_DAYS = 90;

export function isShowSnoozed(snoozedUntil: string | null | undefined, now: DateTime = DateTime.now()): boolean {
  if (!snoozedUntil) return false;
  return DateTime.fromSQL(snoozedUntil).startOf('day') >= now.startOf('day');
}

export function effectiveAirdate(airdate: string, delayDays: number): string {
  return DateTime.fromSQL(airdate).plus({ days: delayDays }).toFormat('yyyy-MM-dd');
}
