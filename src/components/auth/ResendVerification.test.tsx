import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { renderWithProviders } from '@/test/render';
import { ResendVerification } from './ResendVerification';

describe('ResendVerification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('confirms once a new link is requested', async () => {
    stubFetch(mockFetchResponse({ message: 'ok' }));
    const user = userEvent.setup();
    renderWithProviders(<ResendVerification email="a@example.com" />);
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));
    expect(await screen.findByText(/new link is on its way/)).toBeInTheDocument();
  });

  it('shows an error on an API failure', async () => {
    stubFetch(mockFetchResponse({}, { ok: false, status: 503 }));
    const user = userEvent.setup();
    renderWithProviders(<ResendVerification email="a@example.com" />);
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));
    expect(await screen.findByText(/Couldn't send a new link/)).toBeInTheDocument();
  });

  it('shows an error when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const user = userEvent.setup();
    renderWithProviders(<ResendVerification email="a@example.com" />);
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));
    expect(await screen.findByText(/Couldn't send a new link/)).toBeInTheDocument();
  });
});
