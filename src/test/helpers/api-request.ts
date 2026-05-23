import { NextRequest } from 'next/server';

export function nextGet(path: string, search?: Record<string, string>) {
  const url = new URL(path, 'http://localhost');
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      url.searchParams.set(key, value);
    }
  }
  return new NextRequest(url);
}

export function nextPost(path: string, body: unknown) {
  return new NextRequest(new URL(path, 'http://localhost'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function nextPut(path: string) {
  return new NextRequest(new URL(path, 'http://localhost'), { method: 'PUT' });
}

export function nextDelete(path: string) {
  return new NextRequest(new URL(path, 'http://localhost'), { method: 'DELETE' });
}

export function routeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}
