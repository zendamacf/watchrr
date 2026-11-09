---
'watchrr': minor
---

Add session invalidation groundwork: session tokens now carry a per-user version (`users.token_version`) that is checked on authenticated requests and bumped when a password changes.
