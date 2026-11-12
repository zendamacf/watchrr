import { describe, expect, it, vi } from 'vitest';
import { createTtlCache } from './cache';

const cache = (maxEntries = 10) => createTtlCache<string>({ ttlMs: 1000, maxEntries });

describe('createTtlCache', () => {
  it('loads once while the entry is fresh', async () => {
    const load = vi.fn().mockResolvedValue('a');
    const c = cache();

    expect(await c.get('k', load, 0)).toBe('a');
    expect(await c.get('k', load, 999)).toBe('a');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads again once the entry has expired', async () => {
    const load = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
    const c = cache();

    await c.get('k', load, 0);
    expect(await c.get('k', load, 1000)).toBe('b');
  });

  it('shares one load between concurrent requests', async () => {
    const load = vi.fn().mockResolvedValue('a');
    const c = cache();

    await Promise.all([c.get('k', load, 0), c.get('k', load, 0)]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('a');
    const c = cache();

    await expect(c.get('k', load, 0)).rejects.toThrow('boom');
    expect(await c.get('k', load, 1)).toBe('a');
  });

  it('keeps a newer load when an older failed one settles late', async () => {
    let rejectOld: (e: Error) => void = () => {};
    const old = new Promise<string>((_, reject) => {
      rejectOld = reject;
    });
    const c = cache();

    const first = c.get('k', () => old, 0).catch(() => {});
    await c.get('k', async () => 'new', 1000); // expired, replaced
    rejectOld(new Error('late'));
    await first;

    const load = vi.fn();
    expect(await c.get('k', load, 1001)).toBe('new');
    expect(load).not.toHaveBeenCalled();
  });

  it('evicts the oldest entry past the limit', async () => {
    const c = cache(2);
    await c.get('a', async () => '1', 0);
    await c.get('b', async () => '2', 0);
    await c.get('c', async () => '3', 0);

    const reload = vi.fn().mockResolvedValue('again');
    await c.get('a', reload, 1);
    expect(reload).toHaveBeenCalledTimes(1);
    const kept = vi.fn();
    await c.get('c', kept, 1);
    expect(kept).not.toHaveBeenCalled();
  });

  it('clear forgets everything', async () => {
    const load = vi.fn().mockResolvedValue('a');
    const c = cache();

    await c.get('k', load, 0);
    c.clear();
    await c.get('k', load, 1);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
