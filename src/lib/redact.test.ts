import { afterEach, describe, expect, it, vi } from 'vitest';
import { redactDeep, redactSecrets, sanitizeError } from './redact';

describe('redaction', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(['AUTH_JWT_SECRET', 'THEMOVIEDB_ACCESS_TOKEN', 'CRON_SECRET', 'RESEND_API_KEY'])('redacts %s', (name) => {
    vi.stubEnv(name, 'super-secret-value-123');
    expect(redactSecrets('oops super-secret-value-123 here')).toBe('oops [REDACTED] here');
  });

  it('redacts DATABASE_URL and its password on their own', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://watchrr:hunter2hunter2@db:5432/watchrr');
    const out = redactSecrets('connect postgresql://watchrr:hunter2hunter2@db:5432/watchrr failed; pw hunter2hunter2');
    expect(out).not.toContain('hunter2');
  });

  it('redacts connection-string credentials even when not in env', () => {
    expect(redactSecrets('postgres://u:pw@host/db')).toBe('postgres://u:[REDACTED]@host/db');
  });

  it('redacts resend-style keys', () => {
    expect(redactSecrets('re_abcdefghij12345')).toBe('[REDACTED]');
  });

  it('leaves short values alone', () => {
    vi.stubEnv('CRON_SECRET', 'abc');
    expect(redactSecrets('abc')).toBe('abc');
  });

  it('sanitizes error message and stack and drops cause', () => {
    vi.stubEnv('RESEND_API_KEY', 're_supersecret123');
    const clean = sanitizeError(new Error('401 re_supersecret123', { cause: new Error('re_supersecret123') }));
    expect(clean.message).not.toContain('supersecret');
    expect(clean.stack).not.toContain('supersecret');
    expect(clean.cause).toBeUndefined();
  });

  it('deep-redacts nested objects', () => {
    vi.stubEnv('AUTH_JWT_SECRET', 'super-secret-value-123');
    expect(redactDeep({ a: { b: ['x super-secret-value-123'] } })).toEqual({ a: { b: ['x [REDACTED]'] } });
  });
});
