import { DateTime } from 'luxon';

export const MAX_DELAY_DAYS = 90;
export const DELAY_UI_COLOR = 'grape' as const;
export const SNOOZE_UI_COLOR = 'orange' as const;

export function isShowSnoozed(snoozedUntil: string | null | undefined, now: DateTime = DateTime.now()): boolean {
  if (!snoozedUntil) return false;
  return DateTime.fromSQL(snoozedUntil).startOf('day') >= now.startOf('day');
}

export function effectiveAirdate(airdate: string, delayDays: number): string {
  return DateTime.fromSQL(airdate).plus({ days: delayDays }).toFormat('yyyy-MM-dd');
}
