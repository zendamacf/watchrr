import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { parseEpisodeDate } from './parseEpisodeDate';

describe('parseEpisodeDate', () => {
  it('applies delay days to the effective local date', () => {
    const { originalLocalDate, effectiveLocalDate, inPast } = parseEpisodeDate('2026-01-01', 'US', 14);
    expect(effectiveLocalDate.diff(originalLocalDate, 'days').days).toBe(14);
    expect(inPast).toBe(true);
  });

  it('parses episodes without a show country using SQL dates directly', () => {
    const futureDate = DateTime.now().plus({ days: 30 }).toFormat('yyyy-MM-dd');
    const { effectiveLocalDate, inPast } = parseEpisodeDate(futureDate, null, 0);
    expect(effectiveLocalDate.toFormat('yyyy-MM-dd')).toBe(futureDate);
    expect(inPast).toBe(false);
  });
});
