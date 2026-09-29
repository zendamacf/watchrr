-- Hot paths: GET /api/episode (join/filter by watcher, order by airdate per show), refresher episode sync per tvshow_id.
CREATE INDEX "episodes_tvshow_id_idx" ON "episodes" USING btree ("tvshow_id");--> statement-breakpoint
CREATE INDEX "episodes_tvshow_id_airdate_idx" ON "episodes" USING btree ("tvshow_id","airdate");--> statement-breakpoint
CREATE INDEX "subscribed_tvshows_watcher_id_idx" ON "subscribed_tvshows" USING btree ("watcher_id");--> statement-breakpoint
CREATE INDEX "watched_episodes_watcher_id_idx" ON "watched_episodes" USING btree ("watcher_id");