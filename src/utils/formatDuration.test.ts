import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it.each([
    [0, '0m'],
    [45, '45m'],
    [60, '1h 0m'],
    [125, '2h 5m'],
    [1440, '1d 0h'],
    [3 * 1440 + 4 * 60 + 30, '3d 4h'],
    [44.6, '45m'],
  ])('formats %s minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
