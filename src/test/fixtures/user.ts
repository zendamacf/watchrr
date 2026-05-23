/** Stable emails for idempotent seeds across test runs. */
export const seedEmails = {
  loginSuccess: 'vitest-login-success@example.com',
  loginWrongPassword: 'vitest-login-wrong-password@example.com',
  signupTaken: 'vitest-signup-taken@example.com',
} as const;

export const seedPassword = 'secret';
