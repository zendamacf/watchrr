import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
  test: {
    maxWorkers: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        '**/*.d.ts',
        'src/instrumentation*.ts',
        'src/app/global-error.tsx',
        'src/app/error.tsx',
        'src/lib/db/schema.ts',
        'src/lib/db/index.ts',
        'src/lib/refresher/movies.ts',
        'src/lib/refresher/tvshows.ts',
        'src/lib/themoviedb/client.ts',
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/components/Layout/AuthedPage.tsx',
        'src/components/**',
        'src/lib/sentry/**',
      ],
      thresholds: {
        lines: 95,
        statements: 92,
        branches: 82,
        functions: 98,
        'src/lib/auth/**': {
          lines: 95,
          branches: 90,
        },
        'src/lib/refresher/**': {
          lines: 95,
        },
        'src/lib/themoviedb/**': {
          lines: 95,
        },
        'src/app/api/**': {
          lines: 90,
          branches: 80,
        },
        'src/app/(app)/**': {
          lines: 90,
          branches: 78,
        },
        'src/hooks/**': {
          lines: 90,
          branches: 75,
        },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          envFile: '.env',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'happy-dom',
          envFile: '.env',
          setupFiles: ['./vitest.setup.ts', './vitest.setup.dom.ts'],
          include: ['src/**/*.test.tsx'],
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
