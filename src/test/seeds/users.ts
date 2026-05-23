import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db';
import { lower, users } from '@/lib/db/schema';

export type SeededUser = {
  id: string;
  email: string;
  password: string;
};

/**
 * Insert a user or return the existing row for this email (idempotent across test runs).
 */
export async function seedUser(options: { email: string; password: string }): Promise<SeededUser> {
  const email = options.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(lower(users.email), email))
    .limit(1);

  if (existing) {
    return { id: existing.id, email: existing.email, password: options.password };
  }

  const passwordHash = await hashPassword(options.password);

  try {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id, email: users.email });
    if (!user) {
      throw new Error(`Failed to seed user ${email}`);
    }
    return { id: user.id, email: user.email, password: options.password };
  } catch (error) {
    const isDuplicate =
      typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505';
    if (!isDuplicate) throw error;

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(lower(users.email), email))
      .limit(1);
    if (!user) {
      throw new Error(`Failed to seed user ${email}`);
    }
    return { id: user.id, email: user.email, password: options.password };
  }
}
