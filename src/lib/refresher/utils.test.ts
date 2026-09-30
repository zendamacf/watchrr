import { describe, expect, it } from 'vitest';
import { dateCompare, getDiff, isoToSqlDate } from './utils';

describe('getDiff', () => {
  it('returns empty when db and api values match with default compare', () => {
    const db = { name: 'A', year: 2020 };
    const api = { title: 'A', year: 2020 };
    const lookup = [
      { dbKey: 'name' as const, apiKey: 'title' as const },
      { dbKey: 'year' as const, apiKey: 'year' as const },
    ];
    expect(getDiff(db, api, lookup)).toEqual([]);
  });

  it('returns keys that differ with default compare', () => {
    const db = { name: 'Old', rating: 8 };
    const api = { title: 'New', rating: 8 };
    const lookup = [
      { dbKey: 'name' as const, apiKey: 'title' as const },
      { dbKey: 'rating' as const, apiKey: 'rating' as const },
    ];
    expect(getDiff(db, api, lookup)).toEqual([{ dbKey: 'name', apiKey: 'title' }]);
  });

  it('uses custom compare when provided', () => {
    const db = { releasedate: '2024-01-15' };
    const api = { releasedate: '2024-01-15T12:00:00.000Z' };
    const alwaysEqual = () => true;
    const lookup = [{ dbKey: 'releasedate' as const, apiKey: 'releasedate' as const, compare: alwaysEqual }];
    expect(getDiff(db, api, lookup)).toEqual([]);
  });

  it('reports diff when custom compare returns false', () => {
    const db = { releasedate: '2024-01-15' };
    const api = { releasedate: '2024-01-16T00:00:00.000Z' };
    const lookup = [{ dbKey: 'releasedate' as const, apiKey: 'releasedate' as const, compare: dateCompare }];
    expect(getDiff(db, api, lookup)).toHaveLength(1);
  });
});

describe('isoToSqlDate', () => {
  it('converts a valid ISO string to SQL date', () => {
    expect(isoToSqlDate('2024-01-15T00:00:00.000Z')).toBe('2024-01-15');
  });

  it('throws for an invalid ISO string', () => {
    expect(() => isoToSqlDate('not-a-date')).toThrow('Invalid ISO date');
  });
});

describe('dateCompare', () => {
  it('returns true for same calendar day in SQL and ISO formats', () => {
    expect(dateCompare('2024-01-15', '2024-01-15')).toBe(true);
    expect(dateCompare('2024-06-01', '2024-06-01T00:00:00.000Z')).toBe(true);
  });

  it('returns false for different calendar days', () => {
    expect(dateCompare('2024-01-15', '2024-01-16')).toBe(false);
    expect(dateCompare('2024-01-15', '2024-01-16T00:00:00.000Z')).toBe(false);
  });
});
