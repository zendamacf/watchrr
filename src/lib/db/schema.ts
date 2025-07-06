import {
  boolean,
  date,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';

/**
 * Public schema
 */

export const tvshows = pgTable('tvshows', {
  id: serial().primaryKey(),
  name: text().notNull(),
  moviedb_id: integer().notNull().unique(),
  country: text(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
});

export const episodes = pgTable('episodes', {
  id: serial().primaryKey(),
  tvshow_id: integer()
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

export const watcher_tvshows = pgTable(
  'watcher_tvshows',
  {
    tvshow_id: integer()
      .notNull()
      .references(() => tvshows.id, { onDelete: 'cascade' }),
    watcher_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.tvshow_id, t.watcher_id] })],
);

export const watcher_episodes = pgTable(
  'watcher_episodes',
  {
    episode_id: integer()
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    watcher_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
    watched: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.episode_id, t.watcher_id] })],
);

export const movies = pgTable('movies', {
  id: serial().primaryKey(),
  name: text().notNull(),
  releasedate: date(),
  moviedb_id: integer().notNull().unique(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
});

export const watcher_movies = pgTable(
  'watcher_movies',
  {
    movie_id: integer()
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    watcher_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
    watched: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.movie_id, t.watcher_id] })],
);
