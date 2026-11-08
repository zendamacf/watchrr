import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { InfiniteScrollSentinel } from './index';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

describe('InfiniteScrollSentinel', () => {
  let trigger: Callback | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    trigger = undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: Callback) {
          trigger = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders nothing when there is no next page', () => {
    renderWithProviders(
      <InfiniteScrollSentinel hasNextPage={false} isFetchingNextPage={false} fetchNextPage={vi.fn()} loadedCount={5} />,
    );
    expect(screen.queryByTestId('infinite-scroll-sentinel')).not.toBeInTheDocument();
  });

  it('fetches the next page when scrolled into view', () => {
    const fetchNextPage = vi.fn();
    renderWithProviders(
      <InfiniteScrollSentinel hasNextPage isFetchingNextPage={false} fetchNextPage={fetchNextPage} loadedCount={5} />,
    );

    trigger?.([{ isIntersecting: false }]);
    expect(fetchNextPage).not.toHaveBeenCalled();

    trigger?.([{ isIntersecting: true }]);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not observe while a page is already loading', () => {
    renderWithProviders(
      <InfiniteScrollSentinel hasNextPage isFetchingNextPage fetchNextPage={vi.fn()} loadedCount={5} />,
    );
    expect(trigger).toBeUndefined();
  });

  it('re-creates the observer when more rows have loaded', () => {
    const { rerender } = renderWithProviders(
      <InfiniteScrollSentinel hasNextPage isFetchingNextPage={false} fetchNextPage={vi.fn()} loadedCount={5} />,
    );
    rerender(
      <InfiniteScrollSentinel hasNextPage isFetchingNextPage={false} fetchNextPage={vi.fn()} loadedCount={10} />,
    );
    expect(disconnect).toHaveBeenCalled();
  });
});
