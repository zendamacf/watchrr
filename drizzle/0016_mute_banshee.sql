CREATE TYPE "public"."dismissal_reason" AS ENUM('not_interested', 'already_watched');--> statement-breakpoint
ALTER TABLE "not_interested_movies" ADD COLUMN "reason" "dismissal_reason" DEFAULT 'not_interested' NOT NULL;--> statement-breakpoint
ALTER TABLE "not_interested_tvshows" ADD COLUMN "reason" "dismissal_reason" DEFAULT 'not_interested' NOT NULL;