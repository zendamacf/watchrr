ALTER TABLE "tvshows" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "movies" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "episodes" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "episodes" RENAME COLUMN "tvshow_uuid" TO "tvshow_id";--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" RENAME COLUMN "tvshow_uuid" TO "tvshow_id";--> statement-breakpoint
ALTER TABLE "subscribed_movies" RENAME COLUMN "movie_uuid" TO "movie_id";--> statement-breakpoint
ALTER TABLE "watched_episodes" RENAME COLUMN "episode_uuid" TO "episode_id";
