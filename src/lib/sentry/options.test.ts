import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sentryInitOptions', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousSampleRate === undefined) {
      delete process.env.SENTRY_TRACES_SAMPLE_RATE;
    } else {
      process.env.SENTRY_TRACES_SAMPLE_RATE = previousSampleRate;
    }
    vi.resetModules();
  });

  it('uses zero trace sampling in development', async () => {
    process.env.NODE_ENV = 'development';
    const { sentryInitOptions } = await import('./options');
    expect(sentryInitOptions.tracesSampleRate).toBe(0);
    expect(sentryInitOptions.enabled).toBe(false);
  });

  it('defaults production trace sampling below 1.0', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SENTRY_TRACES_SAMPLE_RATE;
    const { sentryInitOptions } = await import('./options');
    expect(sentryInitOptions.tracesSampleRate).toBe(0.1);
    expect(sentryInitOptions.enabled).toBe(true);
  });

  it('honors SENTRY_TRACES_SAMPLE_RATE in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_TRACES_SAMPLE_RATE = '0.25';
    const { sentryInitOptions } = await import('./options');
    expect(sentryInitOptions.tracesSampleRate).toBe(0.25);
  });
});
