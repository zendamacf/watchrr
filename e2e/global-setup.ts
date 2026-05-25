import './load-env-first';
import { e2eEmails, seedPassword } from '../src/test/fixtures/user';
import { seedUser } from '../src/test/seeds/users';

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for e2e tests. Set it in .env or the environment.');
  }

  process.env.AUTH_JWT_SECRET ??= 'test-jwt-secret';
  process.env.THEMOVIEDB_ACCESS_TOKEN ??= 'test-tmdb-token';

  await seedUser({ email: e2eEmails.login, password: seedPassword });
}
