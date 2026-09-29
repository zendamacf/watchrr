import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sentryInitOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses zero trace sampling in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { sentryInitOptions } = await import('./options');
    expect(sentryInitOptions.tracesSampleRate).toBe(0);
    expect(sentryInitOptions.enabled).toBe(false);
  });

  it('defaults production trace sampling below 1.0', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SENTRY_TRACES_SAMPLE_RATE', '');
    const { sentryInitOptions } = await import('./options');
    expect(sentryInitOptions.tracesSampleRate).toBe(0.1);
    expect(sentryInitOptions.enabled).toBe(true);
  });

  it('honors SENTRY_TRACES_SAMPLE_RATE in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SENTRY_TRACES_SAMPLE_RATE', '0.25');
    const { sentryInitOptions } = await import('./options');
    expect(sentryInitOptions.tracesSampleRate).toBe(0.25);
  });
});
