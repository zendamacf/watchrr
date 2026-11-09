import { describe, expect, it } from 'vitest';
import { verifyEmailTemplate } from './verify-email';

describe('verifyEmailTemplate', () => {
  const url = 'https://watchrr.test/verify-email?token=a&b="x"';
  const email = verifyEmailTemplate({ verifyUrl: url, expiresInHours: 24 });

  it('includes the link and expiry in html and text', () => {
    expect(email.subject).toMatch(/confirm/i);
    expect(email.text).toContain(url);
    expect(email.text).toContain('24 hours');
    expect(email.html).toContain('24 hours');
  });

  it('escapes the url in html', () => {
    expect(email.html).not.toContain('b="x"');
    expect(email.html).toContain('&quot;');
  });
});
