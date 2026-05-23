import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the light-scheme logo after mount', async () => {
    renderWithProviders(<Logo w={120} h={40} />);

    await waitFor(() => {
      const image = screen.getByRole('img', { name: 'watchrr logo' });
      expect(image).toHaveAttribute('src', '/watchrr-dark.png');
    });
  });
});
