/**
 * A small in-memory cache for TMDB lookups that many users repeat (e.g. the same recommendation's
 * details). Entries expire after `ttlMs`, the oldest is dropped past `maxEntries`, and concurrent
 * requests for one key share a single load. Failed loads are not cached.
 * It is per server process, so a restart or a second instance just fetches again.
 */
export type TtlCache<T> = {
  get(key: string, load: () => Promise<T>, now?: number): Promise<T>;
  clear(): void;
};

export function createTtlCache<T>({ ttlMs, maxEntries }: { ttlMs: number; maxEntries: number }): TtlCache<T> {
  const entries = new Map<string, { value: Promise<T>; expiresAt: number }>();

  return {
    get(key, load, now = Date.now()) {
      const hit = entries.get(key);
      if (hit && hit.expiresAt > now) return hit.value;

      const value = load();
      // Delete first so a refreshed key moves to the back of the eviction order.
      entries.delete(key);
      entries.set(key, { value, expiresAt: now + ttlMs });
      value.catch(() => {
        if (entries.get(key)?.value === value) entries.delete(key);
      });

      while (entries.size > maxEntries) entries.delete(entries.keys().next().value as string);
      return value;
    },
    clear: () => entries.clear(),
  };
}
