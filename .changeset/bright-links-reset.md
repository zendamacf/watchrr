---
'watchrr': minor
---

Add password recovery: "Forgot password?" on sign-in, emailed single-use reset links (60 minute expiry), and a reset page. Resetting a password signs out every existing session. Requires `RESEND_API_KEY` in production (see README); without it the forgot-password page explains reset isn't available.
