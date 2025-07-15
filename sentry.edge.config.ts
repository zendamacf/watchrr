import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://a42d84a2023c9b94b8feb5d7f5b69479@o4509541345591296.ingest.de.sentry.io/4509671716749392',
  tracesSampleRate: 1,
  debug: false,
});
