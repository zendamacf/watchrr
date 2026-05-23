import { vi } from 'vitest';
import type { AuthUser } from '@/lib/auth/types';

export const mockGuardUser = vi.fn<() => Promise<AuthUser | null>>();

vi.mock('@/utils/auth', () => ({
  guardUser: () => mockGuardUser(),
}));

export function resetAuthGuardMocks() {
  mockGuardUser.mockReset();
}
