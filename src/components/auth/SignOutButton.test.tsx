import '@/test/mocks/navigation';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes, routes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { mockPush, mockRefresh } from '@/test/mocks/navigation';
import { renderWithProviders } from '@/test/render';
import { SignOutButton } from './SignOutButton';

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ ok: true }));
  });

  it('calls logout and navigates home', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignOutButton />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.auth.logout, { method: 'POST' });
      expect(mockPush).toHaveBeenCalledWith(routes.home);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('invokes onSignedOut after logout', async () => {
    const user = userEvent.setup();
    const onSignedOut = vi.fn();
    renderWithProviders(<SignOutButton onSignedOut={onSignedOut} />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(onSignedOut).toHaveBeenCalled();
    });
  });
});
