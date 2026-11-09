---
'watchrr': minor
---

Validate email addresses at signup and verify ownership by email. Malformed addresses are rejected (in the form and the API). When `RESEND_API_KEY` is set, new accounts must confirm a single-use, 24 hour link before signing in, with a rate-limited "resend" option, and password reset emails go only to verified addresses. Existing accounts are migrated as verified; instances without email configured are unaffected.
