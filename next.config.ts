import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
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
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
      automaticVercelMonitors: false,
    });
