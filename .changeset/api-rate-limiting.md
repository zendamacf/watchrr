---
"watchrr": minor
---

API routes now apply per-IP rate limits (login, signup, search, cron, and general API traffic) with `429` responses and `Retry-After` headers.
