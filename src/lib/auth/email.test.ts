import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Example.COM ')).toBe('foo@example.com');
  });
});

describe('isValidEmail', () => {
  it.each(['a@b.co', 'first.last+tag@sub.example.com'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    'plain',
    'a@b',
    '@example.com',
    'a@',
    'a@@example.com',
    'a b@example.com',
    'a@example..com',
    'a@.example.com',
    'a@example.com.',
    `${'x'.repeat(65)}@example.com`,
    `a@${'x'.repeat(250)}.com`,
  ])('rejects %j', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});
