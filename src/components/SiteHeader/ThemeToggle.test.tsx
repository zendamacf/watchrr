import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('toggles color scheme when switched', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />, {
      // light scheme: switch checked (sun visible)
    });

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();

    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).not.toBeChecked();
    });
  });
});
