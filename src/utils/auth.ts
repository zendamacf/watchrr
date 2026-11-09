import { headers } from 'next/headers';
import { authenticateHeaders } from '@/lib/auth/session';
import { isTokenVersionCurrent } from '@/lib/auth/token-version';
import type { AuthUser } from '@/lib/auth/types';

export type { AuthUser } from '@/lib/auth/types';

export const guardUser = async (): Promise<AuthUser | null> => {
  const result = await authenticateHeaders(await headers());
  if (!result) return null;
  // Middleware only checks the signature (edge, no DB); reject sessions invalidated by a password change here.
  if (!(await isTokenVersionCurrent(result.userId, result.tokenVersion))) return null;
  return { id: result.userId };
};
