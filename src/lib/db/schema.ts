import { type SQL, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Public schema
 */

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_email_unique_idx').on(lower(table.email))],
);

export const tvshows = pgTable('tvshows', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  moviedb_id: integer().notNull().unique(),
  country: text(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
});

export const episodes = pgTable('episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tvshow_id: uuid('tvshow_id')
    .notNull()
    .references(() => tvshows.id, { onDelete: 'cascade' }),
  season: integer().notNull(),
  episode: integer().notNull(),
  name: text().notNull(),
  airdate: date().notNull(),
  moviedb_id: integer().notNull().unique(),
  backdrop_slug: text(),
  description: text(),
});

export const subscribed_tvshows = pgTable(
  'subscribed_tvshows',
  {
    tvshow_id: uuid('tvshow_id')
      .notNull()
      .references(() => tvshows.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.tvshow_id, t.watcher_id] })],
);

export const watched_episodes = pgTable(
  'watched_episodes',
  {
    episode_id: uuid('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.episode_id, t.watcher_id] })],
);

export const movies = pgTable('movies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  releasedate: date(),
  moviedb_id: integer().notNull().unique(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
});

export const subscribed_movies = pgTable(
  'subscribed_movies',
  {
    movie_id: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    watched: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.movie_id, t.watcher_id] })],
);

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
