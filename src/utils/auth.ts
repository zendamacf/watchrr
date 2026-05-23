import { headers } from 'next/headers';
import { authenticateHeaders } from '@/lib/auth/session';
import type { AuthUser } from '@/lib/auth/types';

export type { AuthUser } from '@/lib/auth/types';

export const guardUser = async (): Promise<AuthUser | null> => {
  const result = await authenticateHeaders(await headers());
  if (!result) return null;
  return { id: result.userId };
};
