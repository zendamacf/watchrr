import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [
        ['list'],
        ['github'],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['html', { open: 'never', outputFolder: 'playwright-report/html' }],
      ]
    : [['html', { open: 'on-failure', outputFolder: 'playwright-report/html' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: isCI ? 'npm run start' : 'npm run start:dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET ?? 'test-jwt-secret',
      THEMOVIEDB_ACCESS_TOKEN: process.env.THEMOVIEDB_ACCESS_TOKEN ?? 'test-tmdb-token',
    },
  },
});
