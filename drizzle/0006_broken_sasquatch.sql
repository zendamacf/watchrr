ALTER TABLE "subscribed_tvshows" ADD COLUMN "delay_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD COLUMN "snoozed_until" date;