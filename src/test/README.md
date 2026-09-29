# Testing

## Prerequisites

- **Node.js 26** (match [`.nvmrc`](../../.nvmrc) and GitHub Actions).
- Copy [`.env.development.example`](../../.env.development.example) to `.env` at the repo root with a valid `DATABASE_URL` (tests use the real database; no cleanup after runs).
- `AUTH_JWT_SECRET` and `THEMOVIEDB_ACCESS_TOKEN` are set in [`vitest.setup.ts`](vitest.setup.ts) when missing.
- Apply migrations before the first test run: `npm run db:migrate`.

## Commands

```bash
npm test                 # all unit + UI tests
npm run test:coverage    # coverage report + threshold checks
```

Open `coverage/index.html` after a coverage run for per-file detail.

Shared components are included in coverage totals; the global functions threshold is set slightly below 98% to account for server-only layout wrappers that are not unit-tested here.

## Layout

| Area | Location | Notes |
|------|----------|--------|
| Unit tests | `src/**/*.test.ts` | Node; API routes, lib, seeds |
| UI tests | `src/**/*.test.tsx` | happy-dom; components, hooks |
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
- Instrumentation, Sentry wiring, Drizzle schema, TMDB client bootstrap
- `src/lib/db/index.ts` — DB client bootstrap (requires `DATABASE_URL` at import)

Full user flows across pages are a better fit for future E2E (see [TODO.md](TODO.md)).

## CI

[`.github/workflows/tests.yml`](.github/workflows/tests.yml) and [`.github/workflows/pr-linting.yml`](.github/workflows/pr-linting.yml) run migrations, `npm run test:coverage`, and lint/typecheck on pull requests. Vitest thresholds must pass for the job to succeed.
