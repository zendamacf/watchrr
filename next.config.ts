import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
import { version } from './package.json';

const nextConfig: NextConfig = {
  output: 'standalone',
  env: { NEXT_PUBLIC_APP_VERSION: version },
};

const isDockerBuild = process.env.DOCKER_BUILD === '1';

export default isDockerBuild
  ? nextConfig
  : withSentryConfig(nextConfig, {
      org: 'kalopsiadev',
      project: 'watchrr',
      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      tunnelRoute: '/monitoring',
      webpack: {
        // Automatically tree-shake Sentry logger statements to reduce bundle size
        treeshake: { removeDebugLogging: true },
      },
    });
