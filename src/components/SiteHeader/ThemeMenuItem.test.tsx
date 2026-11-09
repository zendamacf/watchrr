import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ThemeMenuItem } from './ThemeMenuItem';

describe('ThemeMenuItem', () => {
  it('toggles dark mode via the switch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeMenuItem />);

    const toggle = await screen.findByRole('switch', { name: 'Dark mode' });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).toBeChecked();
    });
  });
});
