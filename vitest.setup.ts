import { loadEnvFile } from '@/test/load-env';

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for tests. Set it in .env or the environment.');
}

process.env.AUTH_JWT_SECRET ??= 'test-jwt-secret';
process.env.THEMOVIEDB_ACCESS_TOKEN ??= 'test-tmdb-token';
process.env.BCRYPT_ROUNDS ??= '4';
