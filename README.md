# watchrr 📺 🎬

[![Tests](https://github.com/zendamacf/watchrr/actions/workflows/tests.yml/badge.svg)](https://github.com/zendamacf/watchrr/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/zendamacf/watchrr/branch/main/graph/badge.svg)](https://codecov.io/gh/zendamacf/watchrr)

A tracker for your favorite shows & movies.
[watchrr.kalopsia.dev](https://watchrr.kalopsia.dev)

See [TESTING.md](./src/test/README.md) for how to run tests and coverage locally.

## Local development

```bash
cp .env.development.example .env   # set AUTH_JWT_SECRET, THEMOVIEDB_ACCESS_TOKEN, CRON_SECRET, DATABASE_URL
npm ci
npm run db:migrate
npm run start:dev
```

## Docker

```bash
cp .env.example .env   # production Compose secrets (DB_PASSWORD, CRON_SECRET, ALLOW_SIGNUP, …)
# Local/CI: build from source
docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build
# Production: pull published image + cron sidecar
# APP_IMAGE=ghcr.io/zendamacf/watchrr:v2.0.0 docker compose --profile production up -d
```

Set `ALLOW_SIGNUP=false` in `.env` to run a private instance: existing users can sign in, but new registrations are rejected.

API routes are rate limited per client IP (see `RATE_LIMIT_*` in `.env.example`). Authenticated cron calls to `/api/refresh` use a separate, higher limit.
