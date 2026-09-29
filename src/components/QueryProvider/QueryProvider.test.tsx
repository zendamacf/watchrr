import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { QueryProvider } from './QueryProvider';

describe('QueryProvider', () => {
  it('renders children', () => {
    renderWithProviders(
      <QueryProvider>
        <span>Query child</span>
      </QueryProvider>,
    );

    expect(screen.getByText('Query child')).toBeInTheDocument();
  });
});
