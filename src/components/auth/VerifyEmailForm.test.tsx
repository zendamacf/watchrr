import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { VerifyEmailForm } from './VerifyEmailForm';

describe('VerifyEmailForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the token only after the button is clicked, then shows success', async () => {
    stubFetch(mockFetchResponse({ message: 'ok' }));
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailForm token="abc" />);
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirm email' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.auth.verifyEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'abc' }),
      });
    });
    expect(await screen.findByText(/Your email is confirmed/)).toBeInTheDocument();
  });

  it('shows the API error for an expired link', async () => {
    stubFetch(
      mockFetchResponse({ message: 'This verification link is invalid or has expired' }, { ok: false, status: 400 }),
    );
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailForm token="abc" />);
    await user.click(screen.getByRole('button', { name: 'Confirm email' }));
    expect(await screen.findByText(/invalid or has expired/)).toBeInTheDocument();
  });

  it('shows a generic error when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailForm token="abc" />);
    await user.click(screen.getByRole('button', { name: 'Confirm email' }));
    expect(await screen.findByText(/Verification failed/)).toBeInTheDocument();
  });
});
