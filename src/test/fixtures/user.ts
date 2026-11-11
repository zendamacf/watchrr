/** Stable emails for idempotent seeds across test runs. */
export const seedEmails = {
  loginSuccess: 'vitest-login-success@example.com',
  loginWrongPassword: 'vitest-login-wrong-password@example.com',
  signupTaken: 'vitest-signup-taken@example.com',
  apiUser: 'vitest-api@example.com',
  /** Isolated user for tests that assert exact list totals (other files share apiUser concurrently). */
  tvshowPagination: 'vitest-tvshow-pagination@example.com',
  statsOverall: 'vitest-stats-overall@example.com',
  statsShow: 'vitest-stats-show@example.com',
  statsRoute: 'vitest-stats-route@example.com',
  statsOther: 'vitest-stats-other@example.com',
} as const;

export const seedPassword = 'secret';
