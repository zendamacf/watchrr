import { eq } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { email_verification_tokens, users } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';

const mockSendEmail = vi.fn();
vi.mock('@/lib/email/send', () => ({ sendEmail: (...args: unknown[]) => mockSendEmail(...args) }));

import { POST } from './route';

const EMAIL = 'vitest-resend-verification@example.com';

function req(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.resendVerification}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/auth/resend-verification', () => {
  let userId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: EMAIL, password: seedPassword })).id;
  });

  beforeEach(async () => {
    mockSendEmail.mockReset();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('APP_URL', 'https://watchrr.test');
    await db.delete(email_verification_tokens).where(eq(email_verification_tokens.user_id, userId));
    await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, userId));
  });

  afterEach(() => vi.unstubAllEnvs());

  it('400s on invalid input', async () => {
    expect((await POST(req('not json'))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ email: '  ' }))).status).toBe(400);
  });

  it('503s when email is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    expect((await POST(req({ email: EMAIL }))).status).toBe(503);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('emails a link for an unverified account, then rate limits by cooldown', async () => {
    const response = await POST(req({ email: ` ${EMAIL.toUpperCase()} ` }));
    expect(response.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [type, to, props] = mockSendEmail.mock.calls[0] as [string, string, { verifyUrl: string }];
    expect(type).toBe('verifyEmail');
    expect(to).toBe(EMAIL);
    expect(props.verifyUrl).toMatch(/^https:\/\/watchrr\.test\/verify-email\?token=[\w-]+$/);

    const again = await POST(req({ email: EMAIL }));
    expect(again.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('answers identically for unknown and already-verified accounts, sending nothing', async () => {
    const known = await (await POST(req({ email: EMAIL }))).json();
    mockSendEmail.mockReset();

    const unknown = await POST(req({ email: 'no-such-user@example.com' }));
    expect(unknown.status).toBe(200);
    expect(await unknown.json()).toEqual(known);

    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
    await db.delete(email_verification_tokens).where(eq(email_verification_tokens.user_id, userId));
    const verified = await POST(req({ email: EMAIL }));
    expect(await verified.json()).toEqual(known);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
