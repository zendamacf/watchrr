/** Env vars whose values must never reach logs, Sentry or error messages. */
const SECRET_ENV_VARS = [
  'DATABASE_URL',
  'AUTH_JWT_SECRET',
  'THEMOVIEDB_ACCESS_TOKEN',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'DB_PASSWORD',
] as const;

/** Ignore very short values (e.g. dev placeholders) so redaction doesn't mangle ordinary text. */
const MIN_SECRET_LENGTH = 8;

function secretValues(): string[] {
  const values = new Set<string>();
  for (const name of SECRET_ENV_VARS) {
    const value = process.env[name]?.trim();
    if (!value) continue;
    values.add(value);
    if (name === 'DATABASE_URL') {
      try {
        const { password, username } = new URL(value);
        if (password) values.add(decodeURIComponent(password));
        if (password) values.add(password);
        if (username && password) values.add(`${username}:${password}`);
      } catch {
        // Not a parseable URL; the full value is already covered.
      }
    }
  }
  // Longest first so a full URL is replaced before its embedded password.
  return [...values].filter((v) => v.length >= MIN_SECRET_LENGTH).sort((a, b) => b.length - a.length);
}

export function redactSecrets(text: string): string {
  let out = text;
  for (const secret of secretValues()) out = out.replaceAll(secret, '[REDACTED]');
  // Resend-style keys, even if the env value was rotated mid-flight.
  out = out.replace(/\bre_[A-Za-z0-9_]{8,}\b/g, '[REDACTED]');
  // Credentials embedded in any connection string.
  return out.replace(/\b(postgres(?:ql)?:\/\/[^:\s/@]+):[^@\s]+@/gi, '$1:[REDACTED]@');
}

/** Deep-redacts a JSON-serializable value (used for Sentry events). */
export function redactDeep<T>(value: T): T {
  try {
    return JSON.parse(redactSecrets(JSON.stringify(value))) as T;
  } catch {
    return value;
  }
}

/** Returns a fresh Error with a redacted message/stack and no `cause` that could echo a secret. */
export function sanitizeError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const clean = new Error(redactSecrets(message));
  clean.name = error instanceof Error ? error.name : 'Error';
  if (error instanceof Error && error.stack) clean.stack = redactSecrets(error.stack);
  return clean;
}
