ALTER TABLE "episodes" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "tvshows" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "tvshows" ADD CONSTRAINT "tvshows_uuid_unique" UNIQUE("uuid");