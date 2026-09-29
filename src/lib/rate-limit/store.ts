import type { RateLimitPolicy } from './config';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function consumeRateLimit(key: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
  const bucketKey = `${policy.class}:${key}`;
  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + policy.windowMs };
    buckets.set(bucketKey, bucket);
  }

  bucket.count += 1;
  if (bucket.count > policy.max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  return { allowed: true };
}

/** @internal Vitest only — clears in-memory counters between tests. */
export function resetRateLimitStoreForTests(): void {
  buckets.clear();
}
