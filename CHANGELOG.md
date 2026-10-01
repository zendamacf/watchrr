# watchrr

## 3.1.0

### Minor Changes

- 1566384: Self-hosted installs can turn off new account registration with `ALLOW_SIGNUP=false`. People who already have accounts can still sign in; the signup page explains when registration is closed.
- 3ed5497: API routes now apply per-IP rate limits (login, signup, search, cron, and general API traffic) with `429` responses and `Retry-After` headers.
- 40dc6ed: Centralize session checks in Next.js middleware for app pages and protected API routes, reusing existing JWT cookie validation.
- 91ed58a: Scheduled metadata refresh runs incrementally: only stale titles and shows with recent or upcoming episodes are refreshed (fixed thresholds in code).
- e584ba4: Add show detail pages where you can review episodes by season, mark an entire season as watched in one action, and manage release delay and snooze settings.
- 7a4d226: Add TV show lifecycle status to detail page, and filter the shows list by status.

### Patch Changes

- 03d7c0b: Shared UI components are now included in test coverage reports, so the numbers better reflect real app quality.
- 8441194: Database indexes were added for common episode and subscription lookups so lists and sync jobs stay snappy as your library grows.
- 1176ca4: Updated brace-expansion from 5.0.9 to 5.0.12 (version-update:semver-patch).
- 546bbb4: Updated @sentry/nextjs, lucide-react (version-update:semver-minor).
- 335acc1: Updated @tanstack/react-query (version-update:semver-patch).
- 303c475: Updated lucide-react, @changesets/cli (version-update:semver-minor).
- e4b2074: Updated lucide-react, @biomejs/biome, @testing-library/user-event (version-update:semver-minor).
- 8f4a4c1: Updated @tanstack/react-query, jose, @biomejs/biome, @testing-library/user-event, @types/luxon, happy-dom (version-update:semver-minor).
- 335acc1: Updated @tanstack/react-query (version-update:semver-patch).
- d2c030d: Updated @sentry/nextjs, @tanstack/react-query, lucide-react, @biomejs/biome, @testing-library/react, @types/node, happy-dom, lint-staged (version-update:semver-minor).
- daa0db0: Updated @sentry/nextjs, @tanstack/react-query, lucide-react, @types/node, @types/react-dom (version-update:semver-minor).
- 9884810: Updated fast-uri from 3.1.7 to 3.1.8 (version-update:semver-patch).
- ff571d0: Updated @mantine/core, @mantine/hooks, @mantine/modals, @mantine/notifications (version-update:semver-patch).
- ff571d0: Updated @mantine/core, @mantine/hooks, @mantine/modals, @mantine/notifications (version-update:semver-minor).
- 2048c0b: Updated next from 16.3.4 to 16.3.8 (version-update:semver-patch).
- 38514ed: Documentation now covers Node 26 prerequisites, accurate CI workflow names, self-host backups and HTTPS, and a clearer env variable reference.
- 1566384: You can only mark an episode as watched if you follow that TV show. This matches how movies already work and stops watch state from drifting away from your subscriptions.
- 2efff54: Bumps expected PostgreSQL version from 16 to 18.
- 11aca71: Fixed GitHub Actions publish workflow not running for GH Actions-created version tags.
- 03d7c0b: Automated tests now exercise movie and TV show refresh flows end to end (with the movie database mocked), so metadata and episode sync regressions are easier to catch.
- 8441194: Production error monitoring now samples performance traces by default instead of recording every request, which reduces overhead while keeping error reporting the same. Operators can adjust sampling with `SENTRY_TRACES_SAMPLE_RATE` if needed.
- dbc2f45: Add unwatch button to episodes on show detail page.
- b1ddb01: Scheduled refresh and metadata sync now write structured JSON logs (with timing and IDs) so Docker and log tools are easier to search.
- 8a691b0: Optional Umami analytics for production deployments.
- 3ed7606: Fixed cron refresh job failing.

## 3.0.0

### Major Changes

- 8a366bf: Self-host with Docker Compose instead of Vercel.

## 2.0.0

### Major Changes

- 46511bd: Migrates from numeric IDs to UUIDs.

### Minor Changes

- e86b3f1: Add per-show release delay and snooze preferences. Delayed episodes appear on the schedule at their effective date with a status badge; snoozed episodes are hidden from the main timeline and surfaced in a dedicated on-hold section.
- ad0d7f7: Updated API request handlers to automatically log user out if a 401 response is returned.

### Patch Changes

- 7b49884: Updated styling of delays & snoozes for more visual distinction & reduced space.
- d58fc4a: Added CI workflow to automatically create changesets for Dependabot pull requests.
- 373f1db: Updated brace-expansion from 5.0.6 to 5.0.7 (version-update:semver-patch).
- 4550186: Updated brace-expansion from 5.0.7 to 5.0.8 (version-update:semver-patch).
- 4e26cec: Updated brace-expansion from 5.0.8 to 5.0.9 (version-update:semver-patch).
- 274dca9: Updated browserslist from 4.28.2 to 4.28.8 (version-update:semver-patch).
- 62254ba: Updated countries-and-timezones from 3.8.0 to 3.9.0 (version-update:semver-minor).
- 8625064: Updated drizzle-kit from 0.31.1 to 0.31.10 (version-update:semver-patch).
- 9f9b066: Updated @biomejs/biome, @changesets/cli, @testing-library/user-event (version-update:semver-major).
- 3273595: Updated jose (version-update:semver-patch).
- 34fb9d8: Updated @sentry/nextjs (version-update:semver-minor).
- ae24dc4: Updated @biomejs/biome, @testing-library/user-event (version-update:semver-patch).
- 4787ee7: Updated @types/node (version-update:semver-patch).
- 320889b: Updated @sentry/nextjs, @testing-library/jest-dom (version-update:semver-minor).
- 5000713: Updated @biomejs/biome, postcss (version-update:semver-patch).
- 3ec9ead: Updated @biomejs/biome, @types/node, typescript (version-update:semver-major).
- c268f95: Updated lucide-react (version-update:semver-minor).
- 3273595: Updated jose (version-update:semver-patch).
- c268f95: Updated lucide-react (version-update:semver-minor).
- 1d270c4: Updated @sentry/nextjs, @tanstack/react-query, @testing-library/jest-dom (version-update:semver-major).
- 4a0c6f0: Updated @biomejs/biome, @changesets/cli (version-update:semver-patch).
- dcc556a: Updated @sentry/nextjs, lucide-react, happy-dom, lint-staged (version-update:semver-minor).
- 8ee7b72: Updated @sentry/nextjs, lucide-react (version-update:semver-minor).
- 9e6fff3: Updated lucide-react, @types/luxon, @types/node, happy-dom, postcss (version-update:semver-minor).
- 61773f9: Updated @vitest/coverage-v8, vitest (version-update:semver-patch).
- 3fbc6b7: Updated @sentry/nextjs, @tanstack/react-query, lucide-react, next, postgres, @biomejs/biome, @types/node, @vitest/coverage-v8, lint-staged, postcss, postcss-preset-mantine, vitest (version-update:semver-major).
- 2744f40: Updated @sentry/nextjs, lucide-react, lint-staged (version-update:semver-minor).
- dc55ef2: Updated countries-and-timezones (version-update:semver-minor).
- 6cd751b: Updated @tanstack/react-query, react, react-dom, @biomejs/biome (version-update:semver-patch).
- dda257f: Updated jose, happy-dom, lint-staged (version-update:semver-patch).
- a22671f: Updated jose, lucide-react, @types/luxon, @types/react, @types/react-dom, lint-staged (version-update:semver-minor).
- d97505c: Updated @sentry/nextjs, postcss (version-update:semver-minor).
- f98ae45: Updated fast-uri from 3.1.2 to 3.1.4 (version-update:semver-patch).
- ee722a4: Updated fast-uri from 3.1.4 to 3.1.5 (version-update:semver-patch).
- 5ef2a34: Updated fast-uri from 3.1.5 to 3.1.7 (version-update:semver-patch).
- b77a85f: Updated happy-dom from 20.9.0 to 20.10.5 (version-update:semver-minor).
- 785045a: Updated happy-dom from 20.10.5 to 20.10.6 (version-update:semver-patch).
- 54f673c: Updated jose from 6.0.12 to 6.2.3 (version-update:semver-minor).
- 19e93ab: Updated lint-staged from 17.0.5 to 17.0.7 (version-update:semver-patch).
- 0932042: Updated lucide-react from 0.523.0 to 1.20.0 (version-update:semver-major).
- e894ecf: Updated @mantine/core, @mantine/hooks, @mantine/modals, @mantine/notifications (version-update:semver-minor).
- e894ecf: Updated @mantine/core, @mantine/hooks, @mantine/modals, @mantine/notifications (version-update:semver-patch).
- e894ecf: Updated @mantine/core, @mantine/hooks, @mantine/modals, @mantine/notifications (version-update:semver-patch).
- d695bbd: Updated @mantine from 9.3.2 to 9.4.1 (version-update:semver-minor).
- 2d963ff: Updated postcss, next.
- 9fd20c9: Updated luxon, @types/luxon (version-update:semver-minor).
- 2d963ff: Updated js-yaml, js-yaml.
- 90b525a: Updated nanoid from 3.3.17 to 3.3.19 (version-update:semver-patch).
- d022005: Updated next from 16.2.10 to 16.2.11 (version-update:semver-patch).
- 74504a0: Updated next from 16.2.6 to 16.2.9 (version-update:semver-patch).
- b740981: Updated next from 16.3.0 to 16.3.4 (version-update:semver-patch).
- cd73cf5: Updated postcss from 8.5.16 to 8.5.18 (version-update:semver-patch).
- f7b7dc5: Updated @sentry/nextjs from 10.58.0 to 10.60.0 (version-update:semver-minor).
- 93469d5: Updated sharp from 0.35.3 to 0.35.4 (version-update:semver-patch).
- d172082: Updated tmdb-ts from 2.0.1 to 2.3.0 (version-update:semver-minor).
- fe07a27: Updated @types/node from 20.19.1 to 25.9.3 (version-update:semver-major).
- 6cd5c08: Updated @types/react-dom from 19.1.6 to 19.2.3 (version-update:semver-minor).
- b4df1c1: Updated typescript from 5.8.3 to 6.0.3 (version-update:semver-major).
- 69550ac: Updated @vercel/analytics from 1.5.0 to 2.0.1 (version-update:semver-major).
- 0645fb9: Updated vitest from 4.1.10 to 4.1.11 (version-update:semver-patch).
- 9f9b066: Bump Node.js requirement to 26 in CI workflows and `.nvmrc` for changesets 3 compatibility.
- 91e8e4f: Improved performance of tests.
- 6630f5b: Added Codecov integration.
- 05fccb4: Improved test coverage and increased thresholds.
- 84c81d5: Updated Mantine from 8.1.2 to 9.3.2.
- ad0d7f7: Updated theme to use device theme by default.

## 1.1.1

### Patch Changes

- 4b780a1: Added tests for media & refresh API routes.
- a8439ae: Added per-file thresholds plus a few minor test improvements.
- dc23a94: Added tests for lib routes, refresher utils, TMDB adapters.
- 6de2e46: Set up test coverage infrastructure and initial thresholds.
- 28c930f: Added tests for shared media UI components.
- 0f1dc9b: Added tests for hooks.
- 53755ff: Added tests for refresher movie & tvshow sync.

## 1.1.0

### Minor Changes

- Replaced Supabase auth with bespoke JWT auth.
- Adds auth routes to API.
- Introduced testing with Vitest. Initially only new changes have tests set up.
- Introduced linting with Biome (replacing ESLint & Prettier).
- Added provisioning of Neon testing branches in pull requests.
- Improved performance of development environment.
- Set up first database migration using Drizzle.
