ALTER TABLE "episodes" DROP CONSTRAINT IF EXISTS "episodes_tvshow_uuid_tvshows_uuid_fk";--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" DROP CONSTRAINT IF EXISTS "subscribed_tvshows_tvshow_uuid_tvshows_uuid_fk";--> statement-breakpoint
ALTER TABLE "tvshows" DROP CONSTRAINT IF EXISTS "tvshows_pkey";--> statement-breakpoint
ALTER TABLE "tvshows" DROP CONSTRAINT IF EXISTS "tvshows_uuid_unique";--> statement-breakpoint
ALTER TABLE "tvshows" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "tvshows" ADD CONSTRAINT "tvshows_pkey" PRIMARY KEY ("uuid");--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_tvshow_uuid_tvshows_uuid_fk" FOREIGN KEY ("tvshow_uuid") REFERENCES "public"."tvshows"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD CONSTRAINT "subscribed_tvshows_tvshow_uuid_tvshows_uuid_fk" FOREIGN KEY ("tvshow_uuid") REFERENCES "public"."tvshows"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_episodes" DROP CONSTRAINT IF EXISTS "watched_episodes_episode_uuid_episodes_uuid_fk";--> statement-breakpoint
ALTER TABLE "episodes" DROP CONSTRAINT IF EXISTS "episodes_pkey";--> statement-breakpoint
ALTER TABLE "episodes" DROP CONSTRAINT IF EXISTS "episodes_uuid_unique";--> statement-breakpoint
ALTER TABLE "episodes" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_pkey" PRIMARY KEY ("uuid");--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD CONSTRAINT "watched_episodes_episode_uuid_episodes_uuid_fk" FOREIGN KEY ("episode_uuid") REFERENCES "public"."episodes"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_movies" DROP CONSTRAINT IF EXISTS "subscribed_movies_movie_uuid_movies_uuid_fk";--> statement-breakpoint
ALTER TABLE "movies" DROP CONSTRAINT IF EXISTS "movies_pkey";--> statement-breakpoint
ALTER TABLE "movies" DROP CONSTRAINT IF EXISTS "movies_uuid_unique";--> statement-breakpoint
ALTER TABLE "movies" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_pkey" PRIMARY KEY ("uuid");--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD CONSTRAINT "subscribed_movies_movie_uuid_movies_uuid_fk" FOREIGN KEY ("movie_uuid") REFERENCES "public"."movies"("uuid") ON DELETE cascade ON UPDATE no action;
