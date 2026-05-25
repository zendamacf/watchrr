ALTER TABLE "episodes" DROP CONSTRAINT "episodes_tvshow_id_tvshows_id_fk";
--> statement-breakpoint
ALTER TABLE "subscribed_movies" DROP CONSTRAINT "subscribed_movies_movie_id_movies_id_fk";
--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" DROP CONSTRAINT "subscribed_tvshows_tvshow_id_tvshows_id_fk";
--> statement-breakpoint
ALTER TABLE "watched_episodes" DROP CONSTRAINT "watched_episodes_episode_id_episodes_id_fk";
--> statement-breakpoint
DROP INDEX "subscribed_movies_movie_uuid_watcher_id_idx";--> statement-breakpoint
DROP INDEX "subscribed_tvshows_tvshow_uuid_watcher_id_idx";--> statement-breakpoint
DROP INDEX "watched_episodes_episode_uuid_watcher_id_idx";--> statement-breakpoint
ALTER TABLE "subscribed_movies" DROP CONSTRAINT "subscribed_movies_movie_id_watcher_id_pk";--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" DROP CONSTRAINT "subscribed_tvshows_tvshow_id_watcher_id_pk";--> statement-breakpoint
ALTER TABLE "watched_episodes" DROP CONSTRAINT "watched_episodes_episode_id_watcher_id_pk";--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD CONSTRAINT "subscribed_movies_movie_uuid_watcher_id_pk" PRIMARY KEY("movie_uuid","watcher_id");--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD CONSTRAINT "subscribed_tvshows_tvshow_uuid_watcher_id_pk" PRIMARY KEY("tvshow_uuid","watcher_id");--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD CONSTRAINT "watched_episodes_episode_uuid_watcher_id_pk" PRIMARY KEY("episode_uuid","watcher_id");--> statement-breakpoint
ALTER TABLE "episodes" DROP COLUMN "tvshow_id";--> statement-breakpoint
ALTER TABLE "subscribed_movies" DROP COLUMN "movie_id";--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" DROP COLUMN "tvshow_id";--> statement-breakpoint
ALTER TABLE "watched_episodes" DROP COLUMN "episode_id";