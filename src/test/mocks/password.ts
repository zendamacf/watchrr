import { vi } from 'vitest';

export const mockHashPassword = vi.fn();
export const mockVerifyPassword = vi.fn();

vi.mock('@/lib/auth/password', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

export function resetPasswordMocks() {
  mockHashPassword.mockReset();
  mockVerifyPassword.mockReset();
}
