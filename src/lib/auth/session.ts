import { AUTH_COOKIE_NAME } from './constants';
import { verifyAccessToken } from './jwt';

export function parseBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export function getTokenFromCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === name && rest.length > 0) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export function resolveAuthToken(headers: Headers): string | null {
  const bearer = parseBearerToken(headers.get('authorization'));
  if (bearer) return bearer;
  return getTokenFromCookie(headers.get('cookie'), AUTH_COOKIE_NAME);
}

export async function authenticateHeaders(
  headers: Headers,
): Promise<{ userId: string } | null> {
  const token = resolveAuthToken(headers);
  if (!token) return null;
  try {
    const { sub } = await verifyAccessToken(token);
    return { userId: sub };
  } catch {
    return null;
  }
}

export async function authenticateRequest(request: Request): Promise<{ userId: string } | null> {
  return authenticateHeaders(request.headers);
}
