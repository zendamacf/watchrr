# watchrr

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
