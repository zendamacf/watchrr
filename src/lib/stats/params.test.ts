import { describe, expect, it } from 'vitest';
import { parseStatsParams } from './params';

const parse = (query: string) => parseStatsParams(new URLSearchParams(query));

describe('parseStatsParams', () => {
  it('accepts no params', () => {
    expect(parse('')).toEqual({ params: {} });
  });

  it('accepts from, to and tz', () => {
    expect(parse('from=2026-01-01&to=2026-02-01&tz=Europe/London')).toEqual({
      params: { from: '2026-01-01', to: '2026-02-01', timezone: 'Europe/London' },
    });
  });

  it.each([
    ['from=yesterday', 'Invalid from'],
    ['to=2026-13-40', 'Invalid to'],
    ['tz=Nope/Nope', 'Invalid tz'],
    ["tz=UTC';DROP TABLE users;--", 'Invalid tz'],
    ["from=2026-01-01';DROP TABLE users;--", 'Invalid from'],
    ['from=2026-03-01&to=2026-02-01', 'from must not be after to'],
  ])('rejects %s', (query, message) => {
    expect(parse(query)).toEqual({ error: message });
  });
});
