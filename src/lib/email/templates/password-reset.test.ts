import { describe, expect, it } from 'vitest';
import { passwordResetTemplate } from './password-reset';

describe('passwordResetTemplate', () => {
  it('includes the link in html and text and escapes html', () => {
    const out = passwordResetTemplate({ resetUrl: 'https://x.test/r?a=1&b="2"', expiresInMinutes: 30 });
    expect(out.text).toContain('https://x.test/r?a=1&b="2"');
    expect(out.html).toContain('a=1&amp;b=&quot;2&quot;');
    expect(out.html).toContain('30 minutes');
  });
});

describe('email theme', () => {
  it('uses the app brand color, logo and dark mode styles', () => {
    const out = passwordResetTemplate({ resetUrl: 'https://x.test/r', expiresInMinutes: 30 });
    expect(out.html).toContain('#db3556');
    expect(out.html).toContain('/watchrr-dark.png');
    expect(out.html).toContain('prefers-color-scheme: dark');
  });
});
