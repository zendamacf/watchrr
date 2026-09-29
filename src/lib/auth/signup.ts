/** When unset, new user registration is allowed (self-hosted default). */
export function isSignupEnabled(): boolean {
  const raw = process.env.ALLOW_SIGNUP;
  if (raw === undefined || raw.trim() === '') return true;
  const normalized = raw.trim().toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
}
