import { describe, expect, it } from 'vitest';

describe('tmdb client', () => {
  it('exports a client when THEMOVIEDB_ACCESS_TOKEN is set', async () => {
    const { tmdb } = await import('./client');
    expect(tmdb).toBeDefined();
  });
});
