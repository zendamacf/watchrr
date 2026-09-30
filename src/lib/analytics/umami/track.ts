export type UmamiEventData = Record<string, string | number | boolean>;

export function trackUmamiPageView(url: string): void {
  if (typeof window === 'undefined' || !window.umami) {
    return;
  }

  window.umami.track((props) => ({
    ...props,
    url,
  }));
}

export function trackUmamiEvent(event: string, data?: UmamiEventData): void {
  if (typeof window === 'undefined' || !window.umami) {
    return;
  }

  window.umami.track(event, data);
}
