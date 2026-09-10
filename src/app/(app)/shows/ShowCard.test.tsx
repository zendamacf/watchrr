import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testShow } from '@/test/fixtures/tvshow';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import type { SubscribedShow } from '@/types';
import { ShowCard } from './ShowCard';

const { mockRefresh, mockShowError, mockShowSuccess } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
}));

vi.mock('@/hooks/useRefresh', () => ({
  useRefreshShow: () => ({
    refresh: mockRefresh,
    refreshPending: false,
  }),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showInfo: vi.fn(),
    showLoading: vi.fn(),
    doneLoadingSuccess: vi.fn(),
    doneLoadingInfo: vi.fn(),
    doneLoadingError: vi.fn(),
  }),
}));

vi.mock('@mantine/modals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/modals')>();
  return {
    ...actual,
    openConfirmModal: vi.fn(),
  };
});

const show: SubscribedShow = {
  ...testShow,
  id: '00000000-0000-4000-8000-000000000088',
  name: 'Card Show',
  delay_days: 0,
  snoozed_until: null,
};

describe('ShowCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ message: 'Success' }));
  });

  it('calls refresh when the refresh action is clicked', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShows], [show]);
    renderWithProviders(<ShowCard show={show} />, { queryClient });

    await user.click(screen.getByLabelText('Refresh metadata'));

    expect(mockRefresh).toHaveBeenCalledWith({ tvshowId: show.id, name: show.name });
  });

  it('unsubscribes when confirm modal is confirmed', async () => {
    const { openConfirmModal } = await import('@mantine/modals');
    vi.mocked(openConfirmModal).mockImplementation(({ onConfirm }) => {
      onConfirm?.();
      return 'test-modal-id';
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShows], [show]);
    renderWithProviders(<ShowCard show={show} />, { queryClient });

    await user.click(screen.getByLabelText('Unsubscribe'));

    await waitFor(() => {
      expect(openConfirmModal).toHaveBeenCalled();
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Card Show') }),
      );
    });
  });

  it('shows an error and rolls back when unsubscribe fails', async () => {
    const { openConfirmModal } = await import('@mantine/modals');
    vi.mocked(openConfirmModal).mockImplementation(({ onConfirm }) => {
      onConfirm?.();
      return 'test-modal-id';
    });
    stubFetch(mockFetchResponse({ message: 'Forbidden' }, { ok: false, status: 403 }));

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getShows], [show]);
    renderWithProviders(<ShowCard show={show} />, { queryClient });

    await user.click(screen.getByLabelText('Unsubscribe'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.tvshowById(show.id), { method: 'delete' });
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Forbidden' }));
      expect(queryClient.getQueryData([QueryKey.getShows])).toEqual([show]);
    });
  });
});
