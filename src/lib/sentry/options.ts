import type { BrowserOptions, EdgeOptions, NodeOptions } from '@sentry/nextjs';

const dsn = 'https://a42d84a2023c9b94b8feb5d7f5b69479@o4509541345591296.ingest.de.sentry.io/4509671716749392';

const isDev = process.env.NODE_ENV === 'development';

export const sentryInitOptions: NodeOptions & EdgeOptions & BrowserOptions = {
  dsn,
  enabled: !isDev,
  tracesSampleRate: isDev ? 0 : 1,
  debug: false,
};
