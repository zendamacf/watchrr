'use client';

import { Center, Loader } from '@mantine/core';
import { useEffect, useRef } from 'react';

type Props = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  /** Number of rows loaded; re-arms the observer so a still-visible sentinel keeps loading. */
  loadedCount: number;
};

/** Renders at the end of a list and loads the next page when scrolled into view. */
export const InfiniteScrollSentinel = ({ hasNextPage, isFetchingNextPage, fetchNextPage, loadedCount }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadedCount deliberately re-creates the observer
  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNextPage || isFetchingNextPage || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, loadedCount]);

  if (!hasNextPage) return null;

  return (
    <Center ref={ref} py="md" data-testid="infinite-scroll-sentinel">
      {isFetchingNextPage && <Loader size="sm" />}
    </Center>
  );
};
