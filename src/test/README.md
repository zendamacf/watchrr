# Testing

## Prerequisites

- Copy [`.env.example`](.env.example) to `.env` with a valid `DATABASE_URL` (tests use the real database; no cleanup after runs).
- `AUTH_JWT_SECRET` and `THEMOVIEDB_ACCESS_TOKEN` are set in [`vitest.setup.ts`](vitest.setup.ts) when missing.

## Commands

```bash
npm test                 # all unit + UI tests
npm run test:coverage    # coverage report + threshold checks
```

Open `coverage/index.html` after a coverage run for per-file detail.

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
- Shared `src/components/**` (auth forms are tested but excluded from the coverage denominator until component coverage is tracked here)
- Instrumentation, Sentry wiring, Drizzle schema, TMDB client bootstrap

Full user flows across pages are a better fit for future E2E (see [TODO.md](TODO.md)).

## CI

[`.github/workflows/pr-checks.yml`](.github/workflows/pr-checks.yml) runs lint, typecheck, migrations on a Neon preview branch, `npm run test:coverage`, and posts a coverage summary comment on the PR. Vitest thresholds must pass for the job to succeed.
