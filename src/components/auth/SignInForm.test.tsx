import '@/test/mocks/navigation';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes, routes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { mockPush, mockRefresh } from '@/test/mocks/navigation';
import { renderWithProviders } from '@/test/render';
import { SignInForm } from './SignInForm';

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ token: 'jwt-token' }));
  });

  async function submitForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText('email@example.com'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
  }

  it('posts credentials to the login API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    await submitForm(user);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
      });
    });
  });

  it('navigates home on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    await submitForm(user);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(routes.home);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows API error message on failure', async () => {
    stubFetch(mockFetchResponse({ message: 'Invalid email or password' }, { ok: false, status: 401 }));
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    await submitForm(user);

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows generic error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    await submitForm(user);

    expect(await screen.findByText('Sign in failed')).toBeInTheDocument();
  });
});
