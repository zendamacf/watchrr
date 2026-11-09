import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

import { sendEmail } from './send';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('EMAIL_FROM', 'Watchrr <noreply@example.com>');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('posts a rendered template to Resend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const ok = await sendEmail('passwordReset', 'a@b.com', {
      resetUrl: 'https://x.test/reset?token=abc',
      expiresInMinutes: 60,
    });

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ from: 'Watchrr <noreply@example.com>', to: ['a@b.com'] });
    expect(body.text).toContain('https://x.test/reset?token=abc');
  });

  it('returns false instead of throwing when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));
    const ok = await sendEmail('passwordReset', 'a@b.com', { resetUrl: 'https://x.test', expiresInMinutes: 60 });
    expect(ok).toBe(false);
  });

  it('logs instead of sending when no API key is set', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const ok = await sendEmail('passwordReset', 'a@b.com', { resetUrl: 'https://x.test', expiresInMinutes: 60 });
    expect(ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('sendEmail secret handling', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('never logs the API key when the provider echoes it back', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_supersecret123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid key re_supersecret123', { status: 401 })));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendEmail('passwordReset', 'a@b.com', { resetUrl: 'https://x.test', expiresInMinutes: 60 });
    expect(JSON.stringify(spy.mock.calls)).not.toContain('supersecret');
  });
});
