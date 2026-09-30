import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes JSON info logs with fields', () => {
    logger.info('refresh started', { operation: 'refreshMovie', movieId: 'abc' });
    expect(console.log).toHaveBeenCalledOnce();
    const payload = JSON.parse(String((console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]));
    expect(payload).toMatchObject({
      level: 'info',
      message: 'refresh started',
      operation: 'refreshMovie',
      movieId: 'abc',
    });
    expect(payload.time).toBeDefined();
  });

  it('includes stack traces on errors', () => {
    const err = new Error('boom');
    logger.error('refresh failed', err, { operation: 'refreshTvShow' });
    const payload = JSON.parse(String((console.error as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]));
    expect(payload.error).toBe('boom');
    expect(payload.stack).toContain('boom');
  });

  it('writes warn logs to console.warn', () => {
    logger.warn('slow refresh', { operation: 'cronRefresh' });
    expect(console.warn).toHaveBeenCalledOnce();
    const payload = JSON.parse(String((console.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]));
    expect(payload.level).toBe('warn');
  });

  it('serializes non-Error failures', () => {
    logger.error('refresh failed', 'timeout', { operation: 'refreshMovie' });
    const payload = JSON.parse(String((console.error as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]));
    expect(payload.error).toBe('timeout');
  });

  it('includes error cause when present', () => {
    const err = new Error('wrapped');
    err.cause = new Error('root');
    logger.error('refresh failed', err);
    const payload = JSON.parse(String((console.error as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]));
    expect(payload.cause).toBe('root');
  });

  it('logs errors without an exception object', () => {
    logger.error('refresh failed', undefined, { operation: 'cronRefresh' });
    const payload = JSON.parse(String((console.error as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]));
    expect(payload.message).toBe('refresh failed');
    expect(payload.error).toBeUndefined();
  });
});
