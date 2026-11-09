import { eq } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { password_reset_tokens } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';

const mockSendEmail = vi.fn();
vi.mock('@/lib/email/send', () => ({ sendEmail: (...args: unknown[]) => mockSendEmail(...args) }));

import { POST } from './route';

const EMAIL = 'vitest-forgot-password@example.com';

function req(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.forgotPassword}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  let userId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: EMAIL, password: seedPassword })).id;
  });

  beforeEach(async () => {
    mockSendEmail.mockReset();
    vi.stubEnv('APP_URL', 'https://watchrr.test');
    await db.delete(password_reset_tokens).where(eq(password_reset_tokens.user_id, userId));
  });

  afterEach(() => vi.unstubAllEnvs());

  it('400s on invalid input', async () => {
    expect((await POST(req('not json'))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ email: '  ' }))).status).toBe(400);
  });

  it('emails a reset link for a known account', async () => {
    const response = await POST(req({ email: ` ${EMAIL.toUpperCase()} ` }));
    expect(response.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [type, to, props] = mockSendEmail.mock.calls[0] as [string, string, { resetUrl: string }];
    expect(type).toBe('passwordReset');
    expect(to).toBe(EMAIL);
    expect(props.resetUrl).toMatch(/^https:\/\/watchrr\.test\/reset-password\?token=[\w-]+$/);
  });

  it('returns the same response for unknown accounts and sends nothing', async () => {
    const known = await (await POST(req({ email: EMAIL }))).json();
    const unknown = await POST(req({ email: 'no-such-user@example.com' }));
    expect(unknown.status).toBe(200);
    expect(await unknown.json()).toEqual(known);
    expect(mockSendEmail).toHaveBeenCalledTimes(1); // only the known one
  });

  it('503s in production when email is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    expect((await POST(req({ email: EMAIL }))).status).toBe(503);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
