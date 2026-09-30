export type UmamiConfig = {
  websiteId: string;
  scriptUrl: string;
  hostUrl?: string;
};

export const UMAMI_CLOUD_ORIGIN = 'https://cloud.umami.is';

function scriptUrlForHost(hostUrl: string): string {
  const base = hostUrl.replace(/\/$/, '');
  return `${base}/script.js`;
}

export function getUmamiConfig(): UmamiConfig | null {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim();
  if (!websiteId) {
    return null;
  }

  const hostUrl = process.env.UMAMI_HOST_URL?.trim();
  const scriptUrl = scriptUrlForHost(hostUrl ?? UMAMI_CLOUD_ORIGIN);

  return hostUrl
    ? { websiteId, scriptUrl, hostUrl: hostUrl.replace(/\/$/, '') }
    : { websiteId, scriptUrl };
}
