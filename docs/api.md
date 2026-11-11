# List API pagination

The list endpoints `GET /api/episode`, `GET /api/tvshow`, and `GET /api/movie` are always paginated. All require a session cookie.

## Query parameters

| Param | Endpoints | Default | Description |
| --- | --- | --- | --- |
| `limit` | all | `100` | Rows per page, 1–500. |
| `offset` | all | `0` | Number of rows to skip. |
| `search` | all | none | Case-insensitive substring match, up to 100 characters. Episodes match show or episode name; shows and movies match name or description. |
| `status` | `/api/tvshow` | `all` | A TMDB status (`Returning Series`, `Planned`, `In Production`, `Ended`, `Canceled`, `Pilot`), `unknown`, or `all`. |
| `snoozed` | `/api/episode` | both | `true` for snoozed shows only, `false` for scheduled shows only. "Snoozed" is judged by the database's current date. |

Invalid values return `400` with a `message`.

## Response

The body is a JSON array of rows. The total number of rows matching the filters (across all pages) is returned in the `X-Total-Count` response header.

Ordering is stable (it ends in the row `id`), so paging with `offset` neither repeats nor skips rows unless the underlying data changes between requests.

To read everything, request pages until `offset + rows.length >= X-Total-Count` or a page comes back empty.

```
GET /api/movie?search=alien&limit=50&offset=50
X-Total-Count: 132
```

# Statistics API

Both routes require a session cookie and only ever return the signed-in user's data.

## `GET /api/stats`

Overall watch statistics.

| Param | Meaning |
|-------|---------|
| `from`, `to` | Optional `yyyy-MM-dd` bounds (inclusive) for the activity and weekday charts. Default: the last 12 weeks. Totals and backlog ignore them. |
| `tz` | Optional IANA timezone (e.g. `Europe/London`) used to bucket days and weeks. Default `UTC`. |

Invalid values return `400`. The response has watched counts (`total`, `thisWeek`, `thisMonth`, `thisYear`, `unknownDate`) for episodes and movies, `watchMinutes`, `missingRuntimeCount`, weekly `activity`, `weekdays`, show status counts, `backlog`, `streaks` and `genres`.

Items watched before watch times were recorded have no date. They count in `total` (and `unknownDate`), but not in the week/month/year counts, charts or streaks.

`genres` lists watched episodes (`episodes`), movies (`movies`) and estimated `minutes` per genre, most watched first. An item in several genres counts in each. Items whose genres haven't been fetched yet are grouped under `{ "id": null, "name": "Unknown" }`, which is always last. Genres are stored by the TMDB refresh, so existing items fill in as they're refreshed.

## `GET /api/movie/{id}`

A subscribed movie with `subscription` (`watched`, `watched_at`) and `genres` (names, alphabetical; empty until the movie's next refresh). Returns `404` when the user is not subscribed. `GET /api/tvshow/{id}/episodes` also returns `genres`.

## `GET /api/tvshow/{id}/stats`

Per-show statistics: progress for each season, backlog and its estimated time, first and last watched dates, episodes per week and the next air date. Accepts `tz`. Returns `404` when the user is not subscribed to the show.
