/** Stable emails for idempotent seeds across test runs. */
export const seedEmails = {
  loginSuccess: 'vitest-login-success@example.com',
  loginWrongPassword: 'vitest-login-wrong-password@example.com',
  signupTaken: 'vitest-signup-taken@example.com',
  apiUser: 'vitest-api@example.com',
} as const;

/** Dedicated e2e user (Playwright); separate from vitest-* rows. */
export const e2eEmails = {
  login: 'e2e-login@example.com',
} as const;

export const seedPassword = 'secret';
