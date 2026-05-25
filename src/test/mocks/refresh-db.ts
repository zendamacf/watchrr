import { vi } from 'vitest';

export type RefreshDbMovieRow = { movie_id: string; name: string };
export type RefreshDbShowRow = { tvshow_id: string; name: string };

const state = vi.hoisted(() => ({
  selectDistinctCall: 0,
  movies: [] as RefreshDbMovieRow[],
  shows: [] as RefreshDbShowRow[],
}));

function makeSelectDistinctChain(rows: unknown[]) {
  const chain: Record<string, () => unknown> = {};
  chain.from = () => chain;
  chain.innerJoin = () => chain;
  chain.where = () => chain;
  chain.orderBy = () => Promise.resolve(rows);
  return chain;
}

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  const realDb = actual.db;

  const db = new Proxy(realDb, {
    get(target, prop, receiver) {
      if (prop === 'selectDistinct') {
        return () => {
          const rows = state.selectDistinctCall % 2 === 0 ? state.movies : state.shows;
          state.selectDistinctCall += 1;
          return makeSelectDistinctChain(rows);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return { ...actual, db };
});

export function setRefreshDbRows(rows: { movies?: RefreshDbMovieRow[]; shows?: RefreshDbShowRow[] }) {
  if (rows.movies !== undefined) state.movies = rows.movies;
  if (rows.shows !== undefined) state.shows = rows.shows;
}

export function resetRefreshDbMock() {
  state.selectDistinctCall = 0;
  state.movies = [];
  state.shows = [];
}
