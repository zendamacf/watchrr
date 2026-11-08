---
"watchrr": minor
---

Paginate the episode, TV show, and movie list APIs and load their pages with infinite scroll. `GET /api/episode`, `/api/tvshow`, and `/api/movie` now return at most 100 rows by default (`limit` up to 500, plus `offset`) and report the total in the `X-Total-Count` header. Search (and show status / snoozed filters) now run server-side.
