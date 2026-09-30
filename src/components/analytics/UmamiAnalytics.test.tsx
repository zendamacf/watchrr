import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UmamiAnalytics } from './UmamiAnalytics';

const getUmamiConfig = vi.fn();

vi.mock('@/lib/analytics/umami/config', () => ({
  getUmamiConfig: () => getUmamiConfig(),
}));

vi.mock('next/script', () => ({
  default: (props: { src: string; 'data-website-id': string; 'data-host-url'?: string }) => (
    <script
      data-testid="umami-script"
      src={props.src}
      data-website-id={props['data-website-id']}
      data-host-url={props['data-host-url']}
    />
  ),
}));

vi.mock('./UmamiPageViewTracker', () => ({
  UmamiPageViewTracker: () => <span data-testid="page-view-tracker" />,
}));

describe('UmamiAnalytics', () => {
  beforeEach(() => {
    getUmamiConfig.mockReset();
  });

  it('renders nothing when Umami is not configured', () => {
    getUmamiConfig.mockReturnValue(null);
    const { container } = render(<UmamiAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });

  it('injects the Umami script and page view tracker when configured', () => {
    getUmamiConfig.mockReturnValue({
      websiteId: 'site-abc',
      scriptUrl: 'https://cloud.umami.is/script.js',
    });

    render(<UmamiAnalytics />);

    const script = screen.getByTestId('umami-script');
    expect(script).toHaveAttribute('src', 'https://cloud.umami.is/script.js');
    expect(script).toHaveAttribute('data-website-id', 'site-abc');
    expect(script).not.toHaveAttribute('data-host-url');
    expect(screen.getByTestId('page-view-tracker')).toBeInTheDocument();
  });

  it('passes data-host-url for self-hosted instances', () => {
    getUmamiConfig.mockReturnValue({
      websiteId: 'site-abc',
      scriptUrl: 'https://analytics.example.com/script.js',
      hostUrl: 'https://analytics.example.com',
    });

    render(<UmamiAnalytics />);

    expect(screen.getByTestId('umami-script')).toHaveAttribute('data-host-url', 'https://analytics.example.com');
  });
});
