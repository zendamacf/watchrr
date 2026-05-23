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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
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
        'src/lib/themoviedb/client.ts',
      ],
      thresholds: {
        lines: 53,
        statements: 53,
        branches: 53,
        functions: 41,
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
          fileParallelism: false,
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
