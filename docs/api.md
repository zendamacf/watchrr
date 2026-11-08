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
