import { type SQL, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  integer,
  pgTable,
  primaryKey,
  serial,
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
  id: serial().primaryKey(),
  /** Stable public identifier; serial `id` kept until Phase 5. */
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: text().notNull(),
  moviedb_id: integer().notNull().unique(),
  country: text(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
});

export const episodes = pgTable('episodes', {
  id: serial().primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tvshow_uuid: uuid('tvshow_uuid')
    .notNull()
    .references(() => tvshows.uuid, { onDelete: 'cascade' }),
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
    tvshow_uuid: uuid('tvshow_uuid')
      .notNull()
      .references(() => tvshows.uuid, { onDelete: 'cascade' }),
    watcher_id: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.tvshow_uuid, t.watcher_id] })],
);

export const watched_episodes = pgTable(
  'watched_episodes',
  {
    episode_uuid: uuid('episode_uuid')
      .notNull()
      .references(() => episodes.uuid, { onDelete: 'cascade' }),
    watcher_id: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.episode_uuid, t.watcher_id] })],
);

export const movies = pgTable('movies', {
  id: serial().primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
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
    movie_uuid: uuid('movie_uuid')
      .notNull()
      .references(() => movies.uuid, { onDelete: 'cascade' }),
    watcher_id: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    watched: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.movie_uuid, t.watcher_id] })],
);

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
