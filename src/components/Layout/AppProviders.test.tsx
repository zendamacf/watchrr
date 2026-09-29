import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AppProviders } from './AppProviders';

describe('AppProviders', () => {
  it('renders children inside app providers', () => {
    renderWithProviders(
      <AppProviders>
        <span>Wrapped content</span>
      </AppProviders>,
    );

    expect(screen.getByText('Wrapped content')).toBeInTheDocument();
  });
});
