import type { BrowserOptions, EdgeOptions, NodeOptions } from '@sentry/nextjs';

const dsn = 'https://a42d84a2023c9b94b8feb5d7f5b69479@o4509541345591296.ingest.de.sentry.io/4509671716749392';

const isDev = process.env.NODE_ENV === 'development';

const DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE = 0.1;

function parseTracesSampleRate(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) return fallback;
  return value;
}

export const sentryInitOptions: NodeOptions & EdgeOptions & BrowserOptions = {
  dsn,
  enabled: !isDev,
  tracesSampleRate: isDev
    ? 0
    : parseTracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE),
  debug: false,
};
