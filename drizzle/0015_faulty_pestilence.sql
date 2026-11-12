CREATE TABLE "movie_recommendations" (
	"source_movie_id" uuid NOT NULL,
	"moviedb_id" integer NOT NULL,
	"name" text NOT NULL,
	"releasedate" date,
	"poster_slug" text,
	"backdrop_slug" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "movie_recommendations_source_movie_id_moviedb_id_pk" PRIMARY KEY("source_movie_id","moviedb_id")
);
--> statement-breakpoint
CREATE TABLE "not_interested_movies" (
	"watcher_id" uuid NOT NULL,
	"moviedb_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "not_interested_movies_watcher_id_moviedb_id_pk" PRIMARY KEY("watcher_id","moviedb_id")
);
--> statement-breakpoint
CREATE TABLE "not_interested_tvshows" (
	"watcher_id" uuid NOT NULL,
	"moviedb_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "not_interested_tvshows_watcher_id_moviedb_id_pk" PRIMARY KEY("watcher_id","moviedb_id")
);
--> statement-breakpoint
CREATE TABLE "tvshow_recommendations" (
	"source_tvshow_id" uuid NOT NULL,
	"moviedb_id" integer NOT NULL,
	"name" text NOT NULL,
	"country" text,
	"poster_slug" text,
	"backdrop_slug" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tvshow_recommendations_source_tvshow_id_moviedb_id_pk" PRIMARY KEY("source_tvshow_id","moviedb_id")
);
--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "recommendations_refreshed_at" timestamp;--> statement-breakpoint
ALTER TABLE "tvshows" ADD COLUMN "recommendations_refreshed_at" timestamp;--> statement-breakpoint
ALTER TABLE "movie_recommendations" ADD CONSTRAINT "movie_recommendations_source_movie_id_movies_id_fk" FOREIGN KEY ("source_movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_interested_movies" ADD CONSTRAINT "not_interested_movies_watcher_id_users_id_fk" FOREIGN KEY ("watcher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_interested_tvshows" ADD CONSTRAINT "not_interested_tvshows_watcher_id_users_id_fk" FOREIGN KEY ("watcher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tvshow_recommendations" ADD CONSTRAINT "tvshow_recommendations_source_tvshow_id_tvshows_id_fk" FOREIGN KEY ("source_tvshow_id") REFERENCES "public"."tvshows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movie_recommendations_moviedb_id_idx" ON "movie_recommendations" USING btree ("moviedb_id");--> statement-breakpoint
CREATE INDEX "tvshow_recommendations_moviedb_id_idx" ON "tvshow_recommendations" USING btree ("moviedb_id");