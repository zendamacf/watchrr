import { DateTime } from 'luxon';

export type DiffLookup<TDb, TApi> = {
  dbKey: keyof TDb;
  apiKey: keyof TApi;
  compare?: (a: unknown, b: unknown) => boolean;
};

export const dateCompare = (a: unknown, b: unknown) =>
  DateTime.fromSQL(`${a}`)
    .startOf('day')
    .diff(DateTime.fromISO(`${b}`).startOf('day'), 'days').days === 0;

export const isoToSqlDate = (iso: string): string => {
  const sqlDate = DateTime.fromISO(iso).toSQLDate();
  if (!sqlDate) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return sqlDate;
};

const defaultCompare = (a: unknown, b: unknown) => a === b;

export const getDiff = <TDb, TApi>(
  dbMedia: TDb,
  apiMedia: TApi,
  lookup: DiffLookup<TDb, TApi>[],
): DiffLookup<TDb, TApi>[] => {
  return lookup.filter(({ dbKey, apiKey, compare }) =>
    compare ? !compare(dbMedia[dbKey], apiMedia[apiKey]) : !defaultCompare(dbMedia[dbKey], apiMedia[apiKey]),
  );
};
