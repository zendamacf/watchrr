# watchrr 📺 🎬

[![Tests](https://github.com/zendamacf/watchrr/actions/workflows/tests.yml/badge.svg)](https://github.com/zendamacf/watchrr/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/zendamacf/watchrr/branch/main/graph/badge.svg)](https://codecov.io/gh/zendamacf/watchrr)

A tracker for your favorite shows & movies.
[watchrr.kalopsia.dev](https://watchrr.kalopsia.dev)

See [src/test/README.md](./src/test/README.md) for how to run tests and coverage locally.

## Local development

**Requirements:** Node.js **26** (see [`.nvmrc`](./.nvmrc); CI uses the same version) and PostgreSQL reachable at `DATABASE_URL`.

```bash
cp .env.development.example .env   # AUTH_JWT_SECRET, THEMOVIEDB_ACCESS_TOKEN, CRON_SECRET, DATABASE_URL
npm ci
npm run db:migrate
npm run start:dev
```

With Docker only for the database:

```bash
docker compose up -d postgres
# DATABASE_URL=postgresql://watchrr:watchrr@localhost:5432/watchrr
```

Run the test suite (uses the same database; see test README for details):

```bash
npm run db:migrate
npm test
npm run test:coverage
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

API routes are rate limited per client IP with fixed in-app limits. Authenticated cron calls to `/api/refresh` use a separate, higher limit.

`src/middleware.ts` enforces session cookies (same JWT validation as `guardUser()` / API handlers): unauthenticated visitors are redirected from app pages to `/signin`, and protected API routes return `401` without a valid session. Public paths are allowlisted in `src/lib/auth/middleware-config.ts` (auth endpoints, `/health`, `/api/refresh`, Sentry `/monitoring`, etc.).

For backups, HTTPS in front of the app, and production cron setup, see [docs/self-hosting.md](./docs/self-hosting.md).

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Local `.env` | Postgres connection string |
| `DB_PASSWORD` | Docker `.env` | Postgres password for Compose |
| `AUTH_JWT_SECRET` | Both | Signs session tokens; use a long random value |
| `THEMOVIEDB_ACCESS_TOKEN` | Both | TMDB API v4 read token |
| `CRON_SECRET` | Both | Bearer token for `/api/refresh` |
| `ALLOW_SIGNUP` | Both | `false` disables new registrations |
| `APP_PORT` / `PORT` | Docker / local | HTTP port (default 3000) |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional | Production trace sampling (0–1) |
| `UMAMI_WEBSITE_ID` | Optional | Umami site id; enables analytics in production |
| `UMAMI_SCRIPT_URL` | Optional | Umami script URL (self-hosted or cloud) |
| `UMAMI_HOST_URL` | Optional | Umami API base when it differs from the script host |
| `APP_IMAGE` | Docker | Published image tag for production |

Production Compose reads [`.env.example`](./.env.example); local dev uses [`.env.development.example`](./.env.development.example).
