import Script from 'next/script';
import { getUmamiConfig } from '@/lib/analytics/umami/config';
import { UmamiPageViewTracker } from './UmamiPageViewTracker';

export function UmamiAnalytics() {
  const config = getUmamiConfig();
  if (!config) {
    return null;
  }

  return (
    <>
      <Script
        defer
        src={config.scriptUrl}
        data-website-id={config.websiteId}
        {...(config.hostUrl ? { 'data-host-url': config.hostUrl } : {})}
        strategy="afterInteractive"
      />
      <UmamiPageViewTracker />
    </>
  );
}
