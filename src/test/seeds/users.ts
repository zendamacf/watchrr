import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db';
import { lower, users } from '@/lib/db/schema';

export type SeededUser = {
  id: string;
  email: string;
  password: string;
};

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current != null && typeof current === 'object') {
    if ('code' in current && (current as { code: string }).code === '23505') {
      return true;
    }
    current = 'cause' in current ? (current as { cause: unknown }).cause : null;
  }
  return false;
}

async function findUserByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(lower(users.email), email))
    .limit(1);
  return user;
}

/**
 * Insert a user or return the existing row for this email (idempotent across test runs).
 */
export async function seedUser(options: { email: string; password: string }): Promise<SeededUser> {
  const email = options.email.trim().toLowerCase();

  const existing = await findUserByEmail(email);
  if (existing) {
    return { id: existing.id, email: existing.email, password: options.password };
  }

  const passwordHash = await hashPassword(options.password);

  try {
    await db.insert(users).values({ email, passwordHash }).onConflictDoNothing();
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error(`Failed to seed user ${email}`);
  }

  return { id: user.id, email: user.email, password: options.password };
}
