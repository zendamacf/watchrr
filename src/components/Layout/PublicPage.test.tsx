import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { PublicPage } from './PublicPage';

describe('PublicPage', () => {
  it('renders title, subtitle, and children', async () => {
    renderWithProviders(
      <PublicPage title="Test title" subtitle="Test subtitle">
        <p>Form body</p>
      </PublicPage>,
    );

    expect(screen.getByRole('heading', { name: 'Test title' })).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    expect(screen.getByText('Form body')).toBeInTheDocument();
  });
});
