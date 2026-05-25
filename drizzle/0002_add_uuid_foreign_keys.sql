ALTER TABLE "episodes" ADD COLUMN "tvshow_uuid" uuid;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD COLUMN "tvshow_uuid" uuid;--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD COLUMN "episode_uuid" uuid;--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD COLUMN "movie_uuid" uuid;--> statement-breakpoint
UPDATE "episodes" e
SET "tvshow_uuid" = t."uuid"
FROM "tvshows" t
WHERE e."tvshow_id" = t."id";--> statement-breakpoint
UPDATE "subscribed_tvshows" s
SET "tvshow_uuid" = t."uuid"
FROM "tvshows" t
WHERE s."tvshow_id" = t."id";--> statement-breakpoint
UPDATE "watched_episodes" w
SET "episode_uuid" = e."uuid"
FROM "episodes" e
WHERE w."episode_id" = e."id";--> statement-breakpoint
UPDATE "subscribed_movies" s
SET "movie_uuid" = m."uuid"
FROM "movies" m
WHERE s."movie_id" = m."id";--> statement-breakpoint
ALTER TABLE "episodes" ALTER COLUMN "tvshow_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ALTER COLUMN "tvshow_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "watched_episodes" ALTER COLUMN "episode_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribed_movies" ALTER COLUMN "movie_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_tvshow_uuid_tvshows_uuid_fk" FOREIGN KEY ("tvshow_uuid") REFERENCES "public"."tvshows"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD CONSTRAINT "subscribed_tvshows_tvshow_uuid_tvshows_uuid_fk" FOREIGN KEY ("tvshow_uuid") REFERENCES "public"."tvshows"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD CONSTRAINT "watched_episodes_episode_uuid_episodes_uuid_fk" FOREIGN KEY ("episode_uuid") REFERENCES "public"."episodes"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD CONSTRAINT "subscribed_movies_movie_uuid_movies_uuid_fk" FOREIGN KEY ("movie_uuid") REFERENCES "public"."movies"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscribed_tvshows_tvshow_uuid_watcher_id_idx" ON "subscribed_tvshows" USING btree ("tvshow_uuid","watcher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watched_episodes_episode_uuid_watcher_id_idx" ON "watched_episodes" USING btree ("episode_uuid","watcher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribed_movies_movie_uuid_watcher_id_idx" ON "subscribed_movies" USING btree ("movie_uuid","watcher_id");
