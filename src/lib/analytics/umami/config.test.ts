import { afterEach, describe, expect, it, vi } from 'vitest';
import { UMAMI_CLOUD_ORIGIN } from './config';

describe('getUmamiConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns null in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('UMAMI_WEBSITE_ID', 'site-id');
    const { getUmamiConfig } = await import('./config');
    expect(getUmamiConfig()).toBeNull();
  });

  it('returns null in production when website id is unset', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UMAMI_WEBSITE_ID', '');
    const { getUmamiConfig } = await import('./config');
    expect(getUmamiConfig()).toBeNull();
  });

  it('uses the Umami cloud script by default in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UMAMI_WEBSITE_ID', 'abc-123');
    const { getUmamiConfig } = await import('./config');
    expect(getUmamiConfig()).toEqual({
      websiteId: 'abc-123',
      scriptUrl: `${UMAMI_CLOUD_ORIGIN}/script.js`,
    });
  });

  it('derives script URL from UMAMI_HOST_URL for self-hosted', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UMAMI_WEBSITE_ID', 'abc-123');
    vi.stubEnv('UMAMI_HOST_URL', 'https://analytics.example.com/');
    const { getUmamiConfig } = await import('./config');
    expect(getUmamiConfig()).toEqual({
      websiteId: 'abc-123',
      scriptUrl: 'https://analytics.example.com/script.js',
      hostUrl: 'https://analytics.example.com',
    });
  });
});
