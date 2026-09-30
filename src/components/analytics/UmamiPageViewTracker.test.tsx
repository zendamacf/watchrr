import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UmamiPageViewTracker } from './UmamiPageViewTracker';

const mockPathname = vi.fn(() => '/episodes');
const trackUmamiPageView = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('@/lib/analytics/umami/track', () => ({
  trackUmamiPageView: (...args: unknown[]) => trackUmamiPageView(...args),
}));

describe('UmamiPageViewTracker', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/episodes');
    trackUmamiPageView.mockClear();
  });

  it('does not track on the initial render', () => {
    render(<UmamiPageViewTracker />);
    expect(trackUmamiPageView).not.toHaveBeenCalled();
  });

  it('tracks when the pathname changes after mount', () => {
    const { rerender } = render(<UmamiPageViewTracker />);
    expect(trackUmamiPageView).not.toHaveBeenCalled();

    mockPathname.mockReturnValue('/movies');
    rerender(<UmamiPageViewTracker />);

    expect(trackUmamiPageView).toHaveBeenCalledWith('/movies');
  });
});
