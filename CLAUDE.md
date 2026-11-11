# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

watchrr: a self-hosted tracker for TV shows and movies (Next.js App Router + PostgreSQL via Drizzle). TMDB supplies metadata. Deeper docs: `docs/api.md`, `docs/self-hosting.md`, `src/test/README.md`.

## Commands

Node.js 26 (see `.nvmrc`) and a Postgres reachable at `DATABASE_URL`.

```bash
npm ci
cp .env.development.example .env   # needs DATABASE_URL, AUTH_JWT_SECRET, THEMOVIEDB_ACCESS_TOKEN, CRON_SECRET
npm run db:migrate                 # apply Drizzle migrations
npm run start:dev                  # Next dev server (Turbopack)
npm run lint                       # Biome check (lint:fix to autofix; also run by the husky pre-commit hook)
npm run typecheck                  # tsc --noEmit
npm test                           # Vitest, unit + UI tests (uses the real database)
npm run test:coverage              # enforces coverage thresholds (what CI runs)
npm run db:generate                # generate a migration after editing src/lib/db/schema.ts
npm run changeset                  # add a changeset for user-visible changes
```

Run a single test: `npx vitest run src/lib/auth/jwt.test.ts` (add `-t "name"` to filter by test name).

## Testing

- Tests use a real Postgres and do not clean up after runs. Run `npm run db:migrate` before the first run. `AUTH_JWT_SECRET` and `THEMOVIEDB_ACCESS_TOKEN` are set in `vitest.setup.ts` when missing.
- `*.test.ts` runs in Node. `*.test.tsx` runs in happy-dom. Tests sit next to the source. `*.integration.test.ts` files need the database.
- Use `renderWithProviders` and `renderHookWithProviders` (`src/test/`) for components and hooks. Seeds are in `src/test/seeds/`, mocks in `src/test/mocks/`.
- Import mocks from their own module (`@/test/mocks/auth`, `@/test/mocks/themoviedb`), not from `src/test/mocks/index.ts`. The index re-exports the refresher mocks, which replace the module under test.
- Coverage thresholds are enforced (see `vitest.config.mts`, with stricter limits for `src/lib/auth`, `src/lib/refresher` and `src/lib/themoviedb`). Do not add untested logic to `src/lib`.

## Architecture

- **Layout**: `src/app` (pages and `/api/*` route handlers), `src/components` (Mantine UI), `src/hooks`, `src/lib/<domain>` (business logic: `auth`, `db`, `themoviedb`, `refresher`, `rate-limit`, `email`, `stats`, `query`, `analytics`, `sentry`), `src/utils`. Route handlers stay thin. Import with the `@/` alias.
- **Auth**: signed JWT session cookies (`jose`, `AUTH_JWT_SECRET`). `src/middleware.ts` enforces sessions. Public pages and APIs are allowlisted in `src/lib/auth/middleware-config.ts`; update it when you add a public route. Handlers also check the session (`guardUser()`). Sign-up can be turned off with `ALLOW_SIGNUP=false`.
- **Cron**: `GET /api/refresh` is public at the middleware layer. It must verify `Authorization: Bearer <CRON_SECRET>` itself. The Compose `cron` service (profile `production`) calls it on a schedule. Cron calls have a separate, higher rate limit.
- **Rate limiting**: API routes are limited per client IP (`src/lib/rate-limit`).
- **Database**: schema in `src/lib/db/schema.ts`. Migrations in `drizzle/` are generated. Never hand-edit the SQL, snapshots or journal.
- **Client data**: TanStack Query on the client.
- **Observability**: Sentry, Umami and Resend email are optional and must work without configuration. Emails are logged when `RESEND_API_KEY` is unset.
- **Docker**: the multi-stage `Dockerfile` uses Next standalone output. `docker/entrypoint.sh` applies migrations (a bundled `migrate.mjs`) before it starts the server. The CI `deploy-smoke` job builds the image, starts the Compose stack and checks the main routes.

## Workflow notes

- Add a changeset (`npm run changeset`) for user-visible changes. The version and `CHANGELOG.md` are managed by Changesets.
- Style is enforced by Biome. Run `npm run lint:fix` instead of formatting by hand.

## Commit format

Conventional Commits, as seen in recent history: `type: lowercase imperative summary (#PR)`, for example `perf: use Alpine base image (#244)`. Types in use: `feat`, `fix`, `perf`, `chore` (`chore: release vX.Y.Z` for releases), `docs`, `test`, `refactor`. A scope is optional, for example `fix(auth): ...`. Reference the PR number in parentheses at the end.
