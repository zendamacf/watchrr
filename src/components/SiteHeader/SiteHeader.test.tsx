import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { SiteHeader } from './SiteHeader';

const mockPathname = vi.fn(() => routes.episodes);

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(routes.episodes);
    stubFetch(mockFetchResponse({ ok: true, json: [] }));
  });

  it('renders primary navigation links', async () => {
    renderWithProviders(<SiteHeader />);

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: 'Episodes' }).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByRole('link', { name: 'Shows' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Movies' }).length).toBeGreaterThan(0);
  });

  it('marks the active route in navigation', async () => {
    renderWithProviders(<SiteHeader />);

    await waitFor(() => {
      const episodeLinks = screen.getAllByRole('link', { name: 'Episodes' });
      expect(episodeLinks.some((link) => link.className.includes('active'))).toBe(true);
    });
  });
});
