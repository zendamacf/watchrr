export type UmamiConfig = {
  websiteId: string;
  scriptUrl: string;
  hostUrl?: string;
};

export const DEFAULT_UMAMI_SCRIPT_URL = 'https://cloud.umami.is/script.js';

export function getUmamiConfig(): UmamiConfig | null {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim();
  if (!websiteId) {
    return null;
  }

  const scriptUrl = process.env.UMAMI_SCRIPT_URL?.trim() || DEFAULT_UMAMI_SCRIPT_URL;
  const hostUrl = process.env.UMAMI_HOST_URL?.trim();

  return hostUrl ? { websiteId, scriptUrl, hostUrl } : { websiteId, scriptUrl };
}
