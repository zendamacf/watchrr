/**
 * A fresh block of 100 TMDB ids for one test run.
 *
 * Tests share a database and leave rows behind, and a real cron refresh against that database rewrites
 * any row whose id exists on TMDB. Real ids are small (a few million at most), so ids from 900 million up
 * never exist there: a refresh cannot change these rows, and each run starts from rows of its own.
 */
export const uniqueTmdbBase = () => 900_000_000 + Math.floor(Math.random() * 1_000_000) * 100;
