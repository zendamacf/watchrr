import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { effectiveAirdate, isShowSnoozed } from './episode-schedule';

describe('episode-schedule', () => {
  it('detects active snooze through today', () => {
    const today = DateTime.fromISO('2026-09-10');
    expect(isShowSnoozed('2026-09-10', today)).toBe(true);
    expect(isShowSnoozed('2026-09-09', today)).toBe(false);
    expect(isShowSnoozed(null, today)).toBe(false);
  });

  it('shifts effective airdate by delay days', () => {
    expect(effectiveAirdate('2026-09-01', 14)).toBe('2026-09-15');
  });
});
