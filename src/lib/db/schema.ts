import { type SQL, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  index,
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
    /** Bumped on password change; session JWTs carry it and are rejected when stale. */
    tokenVersion: integer('token_version').notNull().default(0),
    /** Null until the owner proves control of the address via the emailed link. */
    emailVerifiedAt: timestamp('email_verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_email_unique_idx').on(lower(table.email))],
);

export const password_reset_tokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 of the emailed token; the raw token is never stored. */
    token_hash: text('token_hash').notNull().unique(),
    expires_at: timestamp('expires_at').notNull(),
    used_at: timestamp('used_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('password_reset_tokens_user_id_idx').on(table.user_id)],
);

export const email_verification_tokens = pgTable(
  'email_verification_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 of the emailed token; the raw token is never stored. */
    token_hash: text('token_hash').notNull().unique(),
    expires_at: timestamp('expires_at').notNull(),
    used_at: timestamp('used_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('email_verification_tokens_user_id_idx').on(table.user_id)],
);

export const tvshows = pgTable('tvshows', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  moviedb_id: integer().notNull().unique(),
  country: text(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
  status: text(),
  metadata_refreshed_at: timestamp('metadata_refreshed_at'),
  /** Last time TMDB recommendations for this show were cached. Null until first fetched. */
  recommendations_refreshed_at: timestamp('recommendations_refreshed_at'),
});

export const episodes = pgTable(
  'episodes',
  {
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
    /** Minutes, from TMDB. Null until the next refresh. */
    runtime: integer(),
  },
  (table) => [
    // Episode list + refresher load episodes per show ordered by airdate.
    index('episodes_tvshow_id_idx').on(table.tvshow_id),
    index('episodes_tvshow_id_airdate_idx').on(table.tvshow_id, table.airdate),
  ],
);

export const subscribed_tvshows = pgTable(
  'subscribed_tvshows',
  {
    tvshow_id: uuid('tvshow_id')
      .notNull()
      .references(() => tvshows.id, { onDelete: 'cascade' }),
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    delay_days: integer('delay_days').notNull().default(0),
    snoozed_until: date('snoozed_until'),
  },
  (t) => [
    primaryKey({ columns: [t.tvshow_id, t.watcher_id] }),
    // Filter subscriptions by watcher (episode list joins on watcher_id).
    index('subscribed_tvshows_watcher_id_idx').on(t.watcher_id),
  ],
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
    /** Null for rows created before watch times were recorded. */
    watched_at: timestamp('watched_at', { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.episode_id, t.watcher_id] }),
    // Watched lookup anti-join in GET /api/episode filters by watcher_id.
    index('watched_episodes_watcher_id_idx').on(t.watcher_id),
  ],
);

export const movies = pgTable('movies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  releasedate: date(),
  moviedb_id: integer().notNull().unique(),
  poster_slug: text(),
  backdrop_slug: text(),
  description: text(),
  /** Minutes, from TMDB. Null until the next refresh. */
  runtime: integer(),
  metadata_refreshed_at: timestamp('metadata_refreshed_at'),
  /** Last time TMDB recommendations for this movie were cached. Null until first fetched. */
  recommendations_refreshed_at: timestamp('recommendations_refreshed_at'),
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
    /** Null for rows created before watch times were recorded. */
    watched_at: timestamp('watched_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.movie_id, t.watcher_id] })],
);

/** TMDB genres, keyed by TMDB's genre id. Names are refreshed with the shows and movies that use them. */
export const genres = pgTable('genres', {
  id: integer('id').primaryKey(),
  name: text().notNull(),
});

export const tvshow_genres = pgTable(
  'tvshow_genres',
  {
    tvshow_id: uuid('tvshow_id')
      .notNull()
      .references(() => tvshows.id, { onDelete: 'cascade' }),
    genre_id: integer('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.tvshow_id, t.genre_id] })],
);

export const movie_genres = pgTable(
  'movie_genres',
  {
    movie_id: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    genre_id: integer('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.movie_id, t.genre_id] })],
);

/**
 * Cached TMDB recommendations, one row per (source movie, recommended movie).
 * Shared across users; per-user scoring happens at query time. Display fields
 * are stored so Discover never calls TMDB on page load.
 */
export const movie_recommendations = pgTable(
  'movie_recommendations',
  {
    source_movie_id: uuid('source_movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    moviedb_id: integer().notNull(),
    name: text().notNull(),
    releasedate: date(),
    poster_slug: text(),
    backdrop_slug: text(),
    description: text(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.source_movie_id, t.moviedb_id] }),
    // Candidates are grouped by TMDB id when scoring.
    index('movie_recommendations_moviedb_id_idx').on(t.moviedb_id),
  ],
);

/** Cached TMDB recommendations for shows. See `movie_recommendations`. */
export const tvshow_recommendations = pgTable(
  'tvshow_recommendations',
  {
    source_tvshow_id: uuid('source_tvshow_id')
      .notNull()
      .references(() => tvshows.id, { onDelete: 'cascade' }),
    moviedb_id: integer().notNull(),
    name: text().notNull(),
    country: text(),
    poster_slug: text(),
    backdrop_slug: text(),
    description: text(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.source_tvshow_id, t.moviedb_id] }),
    // Candidates are grouped by TMDB id when scoring.
    index('tvshow_recommendations_moviedb_id_idx').on(t.moviedb_id),
  ],
);

/** Items a user hid from Discover. Keyed by TMDB id because candidates need not be tracked. */
export const not_interested_movies = pgTable(
  'not_interested_movies',
  {
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    moviedb_id: integer().notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.watcher_id, t.moviedb_id] })],
);

export const not_interested_tvshows = pgTable(
  'not_interested_tvshows',
  {
    watcher_id: uuid('watcher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    moviedb_id: integer().notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.watcher_id, t.moviedb_id] })],
);

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
