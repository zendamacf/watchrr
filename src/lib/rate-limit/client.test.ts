import { describe, expect, it } from 'vitest';
import { getRateLimitClientKey } from './client';

function makeRequest(headers: Record<string, string>) {
  return {
    headers: {
      get(name: string) {
        const lower = name.toLowerCase();
        return headers[lower] ?? null;
      },
    },
  } as import('next/server').NextRequest;
}

describe('getRateLimitClientKey', () => {
  it('uses the first x-forwarded-for address', () => {
    const key = getRateLimitClientKey(makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }));
    expect(key).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    const key = getRateLimitClientKey(makeRequest({ 'x-real-ip': '198.51.100.2' }));
    expect(key).toBe('198.51.100.2');
  });

  it('returns unknown when no forwarding headers exist', () => {
    expect(getRateLimitClientKey(makeRequest({}))).toBe('unknown');
  });
});
