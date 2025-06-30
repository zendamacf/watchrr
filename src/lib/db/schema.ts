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
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  moviedb_id: integer('moviedb_id').notNull(),
  country: text('country').notNull(),
});

export const episodes = pgTable('episodes', {
  id: serial('id').primaryKey(),
  tvshow_id: integer('tvshow_id')
    .notNull()
    .references(() => tvshows.id, { onDelete: 'cascade' }),
  season: integer('season').notNull(),
  episode: integer('episode').notNull(),
  name: text('name').notNull(),
  airdate: date('airdate').notNull(),
  moviedb_id: integer('moviedb_id').notNull(),
});

export const watcher_tvshows = pgTable(
  'watcher_tvshows',
  {
    tvshow_id: integer('tvshow_id')
      .notNull()
      .references(() => tvshows.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.tvshow_id, t.watcher_id] })],
);

export const watcher_episodes = pgTable(
  'watcher_episodes',
  {
    episode_id: integer('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
    watched: boolean('watched').notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.episode_id, t.watcher_id] })],
);

export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  releasedate: date('releasedate'),
  moviedb_id: integer('moviedb_id').notNull(),
});

export const watcher_movies = pgTable(
  'watcher_movies',
  {
    movie_id: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
    watched: boolean('watched').notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.movie_id, t.watcher_id] })],
);
