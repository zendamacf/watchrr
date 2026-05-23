import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('hashPassword and verifyPassword round-trip', async () => {
    const hash = await hashPassword('secret-password');
    expect(hash).not.toBe('secret-password');
    await expect(verifyPassword('secret-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
