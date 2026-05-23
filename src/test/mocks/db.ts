import { vi } from 'vitest';

export const mockLimit = vi.fn();
export const mockReturning = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (...args: unknown[]) => mockLimit(...args),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: (...args: unknown[]) => mockReturning(...args),
      }),
    }),
  },
}));

export function resetDbMocks() {
  mockLimit.mockReset();
  mockReturning.mockReset();
}
