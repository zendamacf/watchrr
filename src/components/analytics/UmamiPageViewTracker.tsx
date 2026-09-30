'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackUmamiPageView } from '@/lib/analytics/umami/track';

/** Sends page views on client navigations (initial load is handled by the Umami script). */
export function UmamiPageViewTracker() {
  const pathname = usePathname();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    trackUmamiPageView(pathname);
  }, [pathname]);

  return null;
}
