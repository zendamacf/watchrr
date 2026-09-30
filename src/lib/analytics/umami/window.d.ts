export type UmamiTrackProps = Record<string, string>;

export type UmamiTracker = {
  track: (
    event?: string | ((props: UmamiTrackProps) => UmamiTrackProps),
    eventData?: Record<string, string | number | boolean>,
  ) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

export {};
