ALTER TABLE "episodes" ADD COLUMN "runtime" integer;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "runtime" integer;--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD COLUMN "watched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD COLUMN "watched_at" timestamp with time zone;