import '@/test/mocks/navigation';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes, routes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { mockPush, mockRefresh } from '@/test/mocks/navigation';
import { renderWithProviders } from '@/test/render';
import { SignUpForm } from './SignUpForm';

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ token: 'jwt-token' }, { status: 201 }));
  });

  async function submitForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText('email@example.com'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));
  }

  it('posts credentials to the signup API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);
    await submitForm(user);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.auth.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', password: 'secret' }),
      });
    });
  });

  it('navigates home on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);
    await submitForm(user);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(routes.home);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows API error message on conflict', async () => {
    stubFetch(mockFetchResponse({ message: 'An account with this email already exists' }, { ok: false, status: 409 }));
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);
    await submitForm(user);

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows generic error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);
    await submitForm(user);

    expect(await screen.findByText('Sign up failed')).toBeInTheDocument();
  });
});
