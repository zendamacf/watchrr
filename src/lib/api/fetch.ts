import { apiRoutes, routes } from '@/lib/routes';

const PUBLIC_AUTH_API_PATHS = new Set<string>([apiRoutes.auth.login, apiRoutes.auth.signup]);

let sessionExpired = false;

/** @internal Vitest only — resets module state between tests. */
export function resetApiFetchStateForTests(): void {
  sessionExpired = false;
}

export function resolveRequestPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return (input.startsWith('http') ? new URL(input) : new URL(input, 'http://localhost')).pathname;
  }
  if (input instanceof URL) return input.pathname;
  return new URL(input.url).pathname;
}

export function isPublicAuthApiRequest(input: RequestInfo | URL): boolean {
  return PUBLIC_AUTH_API_PATHS.has(resolveRequestPath(input));
}

async function handleSessionExpired(): Promise<void> {
  if (sessionExpired) return;
  sessionExpired = true;

  try {
    await fetch(apiRoutes.auth.logout, { method: 'POST' });
  } catch {
    // Still redirect so the user is not stuck on a broken session.
  }

  if (typeof window !== 'undefined') {
    window.location.assign(routes.signin);
  }
}

/** Client-side fetch that logs out and redirects to sign-in on 401 from protected APIs. */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401 && !isPublicAuthApiRequest(input)) {
    await handleSessionExpired();
  }

  return response;
}
