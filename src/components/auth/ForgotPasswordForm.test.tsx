import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { ForgotPasswordForm } from './ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the email and shows a generic confirmation', async () => {
    stubFetch(mockFetchResponse({ message: 'ok' }));
    const fetchMock = vi.mocked(fetch);
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByPlaceholderText('email@example.com'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => expect(screen.getByText(/a reset link is on its way/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      apiRoutes.auth.forgotPassword,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'user@example.com' }) }),
    );
  });

  it('shows the server error', async () => {
    stubFetch(
      mockFetchResponse(
        { message: 'Password reset by email is not available on this instance' },
        { ok: false, status: 503 },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByPlaceholderText('email@example.com'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => expect(screen.getByText(/not available on this instance/)).toBeInTheDocument());
  });
});
