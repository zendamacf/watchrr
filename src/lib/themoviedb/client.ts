import { TMDB } from 'tmdb-ts';

if (!process.env.THEMOVIEDB_ACCESS_TOKEN) throw new Error('THEMOVIEDB_ACCESS_TOKEN is not set');

export const tmdb = new TMDB(process.env.THEMOVIEDB_ACCESS_TOKEN);
