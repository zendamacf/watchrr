import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { FloatingButton } from './FloatingButton';

describe('FloatingButton', () => {
  it('renders and calls onClick when pressed', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<FloatingButton onClick={onClick} aria-label="Add" />);

    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
