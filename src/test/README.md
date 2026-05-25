# Testing

## Prerequisites

- Copy [`.env.example`](.env.example) to `.env` with a valid `DATABASE_URL` (tests use the real database; no cleanup after runs).
- `AUTH_JWT_SECRET` and `THEMOVIEDB_ACCESS_TOKEN` are set in [`vitest.setup.ts`](vitest.setup.ts) when missing.

## Commands

```bash
npm test                 # all unit + UI tests
npm run test:coverage    # coverage report + threshold checks
npm run test:e2e         # Playwright e2e (requires build in CI; see E2E below)
npm run test:e2e:ui      # Playwright UI mode (local debugging)
```

Open `coverage/index.html` after a coverage run for per-file detail.

## Layout

| Area | Location | Notes |
|------|----------|--------|
| Unit tests | `src/**/*.test.ts` | Node; API routes, lib, seeds |
| UI tests | `src/**/*.test.tsx` | happy-dom; components, hooks |
| E2E tests | [`e2e/`](../../e2e/) | Playwright; full browser flows |
| Seeds | [`src/test/seeds/`](src/test/seeds/) | Idempotent inserts |
| Mocks | [`src/test/mocks/`](src/test/mocks/) | Import subpaths directly (see below) |
| Render helpers | [`src/test/render.tsx`](src/test/render.tsx), [`src/test/renderHook.tsx`](src/test/renderHook.tsx) | Mantine + React Query |

## Patterns

**API routes** — seed users/media via [`src/test/seeds`](src/test/seeds), mock auth with [`src/test/mocks/auth.ts`](src/test/mocks/auth.ts):

```ts
import '@/test/mocks/auth';
import { mockGuardUser } from '@/test/mocks/auth';
```

Mock TMDB and refresher from their modules, not [`src/test/mocks/index.ts`](src/test/mocks/index.ts) (re-exporting refresher mocks replaces the module under test):

```ts
import '@/test/mocks/themoviedb';
import '@/test/mocks/refresher'; // only in route tests that call refreshMovie/refreshTvShow
import '@/test/mocks/refresh-db'; // GET /api/refresh — stubs selectDistinct so cron tests do not scan the whole DB
```

**UI components** — [`renderWithProviders`](src/test/render.tsx) (QueryClient, Mantine, modals).

**Hooks** — [`renderHookWithProviders`](src/test/renderHook.tsx); mock `@mantine/notifications` with `vi.hoisted` and assign mocks directly (see [`useAlert.test.tsx`](src/hooks/useAlert.test.tsx)).

**Fetch** — [`stubFetch`](src/test/fetch.ts) / [`mockFetchResponse`](src/test/fetch.ts).

## Intentionally excluded from coverage

Configured in [`vitest.config.mts`](vitest.config.mts):

- App Router `page.tsx` / `layout.tsx`
- Shared `src/components/**` (auth forms are tested but excluded from the coverage denominator until component coverage is tracked here)
- Instrumentation, Sentry wiring, Drizzle schema, TMDB client bootstrap
- `src/lib/db/index.ts` — DB client bootstrap (requires `DATABASE_URL` at import)
- `src/lib/refresher/movies.ts` and `tvshows.ts` — TMDB + DB sync pipelines (exercised via route tests with mocks and dedicated refresher unit tests, not line-tracked here)

Full user flows across pages are covered by E2E (see below), not Vitest coverage %.

## E2E (Playwright)

**Prerequisites:** same `.env` as unit tests (`DATABASE_URL` required). `AUTH_JWT_SECRET` and `THEMOVIEDB_ACCESS_TOKEN` default in [`e2e/global-setup.ts`](../../e2e/global-setup.ts) when missing.

**Local:**

```bash
npx playwright install chromium   # once per machine
npm run build                     # optional if reusing dev server
npm run test:e2e                  # starts dev server unless one is already on :3000
```

Uses `e2e-login@example.com` (seeded in global setup; see [`e2eEmails`](fixtures/user.ts)).

**CI:** [`.github/workflows/pr-e2e-tests.yml`](../../.github/workflows/pr-e2e-tests.yml) — Neon `*-e2e` branch, migrate, build, Playwright, artifact upload, PR comment via `daun/playwright-report-summary`.

Phase 2 (later): add-media flows with Playwright `route` mocks for TMDB (do not hit real API in CI).

## CI

- [`.github/workflows/pr-linting.yml`](../../.github/workflows/pr-linting.yml) — lint and typecheck.
- [`.github/workflows/pr-tests.yml`](../../.github/workflows/pr-tests.yml) — Vitest coverage on Neon `*-tests` branch; coverage PR comment.
- [`.github/workflows/pr-e2e-tests.yml`](../../.github/workflows/pr-e2e-tests.yml) — Playwright e2e on Neon `*-e2e` branch; test-results PR comment.
