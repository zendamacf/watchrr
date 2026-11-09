import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  async function fill(user: ReturnType<typeof userEvent.setup>, password: string, confirm: string) {
    await user.type(screen.getByPlaceholderText('New password'), password);
    await user.type(screen.getByPlaceholderText('Repeat new password'), confirm);
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
  }

  it('does not submit when passwords differ', async () => {
    stubFetch(mockFetchResponse({}));
    const fetchMock = vi.mocked(fetch);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill(user, 'abc12345', 'different');
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the token and password, then shows the sign-in link', async () => {
    stubFetch(mockFetchResponse({ message: 'ok' }));
    const fetchMock = vi.mocked(fetch);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill(user, 'abc12345', 'abc12345');

    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.auth.resetPassword,
      expect.objectContaining({ body: JSON.stringify({ token: 'tok', password: 'abc12345' }) }),
    );
  });

  it('shows an error for an invalid or expired link', async () => {
    stubFetch(mockFetchResponse({ message: 'This reset link is invalid or has expired' }, { ok: false, status: 400 }));
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill(user, 'abc12345', 'abc12345');
    expect(await screen.findByText('This reset link is invalid or has expired')).toBeInTheDocument();
  });
});
