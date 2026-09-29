---
"watchrr": patch
---

Production error monitoring now samples performance traces by default instead of recording every request, which reduces overhead while keeping error reporting the same. Operators can adjust sampling with `SENTRY_TRACES_SAMPLE_RATE` if needed.
