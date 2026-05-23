import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHeaders = vi.fn();
const mockAuthenticateHeaders = vi.fn();

vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}));

vi.mock('@/lib/auth/session', () => ({
  authenticateHeaders: (...args: unknown[]) => mockAuthenticateHeaders(...args),
}));

import { guardUser } from './auth';

describe('guardUser', () => {
  beforeEach(() => {
    mockHeaders.mockReset();
    mockAuthenticateHeaders.mockReset();
  });

  it('returns null when authentication fails', async () => {
    mockHeaders.mockResolvedValue(new Headers());
    mockAuthenticateHeaders.mockResolvedValue(null);
    await expect(guardUser()).resolves.toBeNull();
    expect(mockAuthenticateHeaders).toHaveBeenCalledWith(expect.any(Headers));
  });

  it('returns the user id when authentication succeeds', async () => {
    const requestHeaders = new Headers();
    mockHeaders.mockResolvedValue(requestHeaders);
    mockAuthenticateHeaders.mockResolvedValue({ userId: 'user-123' });
    await expect(guardUser()).resolves.toEqual({ id: 'user-123' });
    expect(mockAuthenticateHeaders).toHaveBeenCalledWith(requestHeaders);
  });
});
