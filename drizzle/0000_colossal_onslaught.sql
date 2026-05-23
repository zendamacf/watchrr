CREATE TABLE "episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tvshow_id" integer NOT NULL,
	"season" integer NOT NULL,
	"episode" integer NOT NULL,
	"name" text NOT NULL,
	"airdate" date NOT NULL,
	"moviedb_id" integer NOT NULL,
	"backdrop_slug" text,
	"description" text,
	CONSTRAINT "episodes_moviedb_id_unique" UNIQUE("moviedb_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"releasedate" date,
	"moviedb_id" integer NOT NULL,
	"poster_slug" text,
	"backdrop_slug" text,
	"description" text,
	CONSTRAINT "movies_moviedb_id_unique" UNIQUE("moviedb_id")
);
--> statement-breakpoint
CREATE TABLE "subscribed_movies" (
	"movie_id" integer NOT NULL,
	"watcher_id" uuid NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	CONSTRAINT "subscribed_movies_movie_id_watcher_id_pk" PRIMARY KEY("movie_id","watcher_id")
);
--> statement-breakpoint
CREATE TABLE "subscribed_tvshows" (
	"tvshow_id" integer NOT NULL,
	"watcher_id" uuid NOT NULL,
	CONSTRAINT "subscribed_tvshows_tvshow_id_watcher_id_pk" PRIMARY KEY("tvshow_id","watcher_id")
);
--> statement-breakpoint
CREATE TABLE "tvshows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"moviedb_id" integer NOT NULL,
	"country" text,
	"poster_slug" text,
	"backdrop_slug" text,
	"description" text,
	CONSTRAINT "tvshows_moviedb_id_unique" UNIQUE("moviedb_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watched_episodes" (
	"episode_id" integer NOT NULL,
	"watcher_id" uuid NOT NULL,
	CONSTRAINT "watched_episodes_episode_id_watcher_id_pk" PRIMARY KEY("episode_id","watcher_id")
);
--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_tvshow_id_tvshows_id_fk" FOREIGN KEY ("tvshow_id") REFERENCES "public"."tvshows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD CONSTRAINT "subscribed_movies_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_movies" ADD CONSTRAINT "subscribed_movies_watcher_id_users_id_fk" FOREIGN KEY ("watcher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD CONSTRAINT "subscribed_tvshows_tvshow_id_tvshows_id_fk" FOREIGN KEY ("tvshow_id") REFERENCES "public"."tvshows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribed_tvshows" ADD CONSTRAINT "subscribed_tvshows_watcher_id_users_id_fk" FOREIGN KEY ("watcher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD CONSTRAINT "watched_episodes_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD CONSTRAINT "watched_episodes_watcher_id_users_id_fk" FOREIGN KEY ("watcher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree (lower("email"));