import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AppFooter, GITHUB_URL, TMDB_URL } from './AppFooter';

describe('AppFooter', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('links to GitHub and shows the version', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.2.3');
    renderWithProviders(<AppFooter />);

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', GITHUB_URL);
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });

  it('attributes TMDB with a logo link and the disclaimer', () => {
    renderWithProviders(<AppFooter />);

    expect(screen.getByRole('link', { name: 'The Movie Database (TMDB)' })).toHaveAttribute('href', TMDB_URL);
    expect(screen.getByText(/uses the TMDB API but is not endorsed or certified by TMDB/)).toBeInTheDocument();
  });
});
