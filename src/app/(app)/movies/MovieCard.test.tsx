import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testMovie } from '@/test/fixtures/movie';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import type { Movie } from '@/types';
import { MovieCard } from './MovieCard';

const { mockShowError, mockShowSuccess } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
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

const movie: Movie = { ...testMovie, id: '00000000-0000-4000-8000-000000000087', name: 'Card Movie' };

describe('MovieCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ message: 'Success' }));
  });

  it('marks a movie as watched via the API', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getMovies], [movie]);
    renderWithProviders(<MovieCard movie={movie} />, { queryClient });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(apiRoutes.movieById(movie.id), { method: 'put' });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Card Movie') }),
      );
    });
  });

  it('shows an error and rolls back when mark watched fails', async () => {
    stubFetch(mockFetchResponse({ message: 'Not found' }, { ok: false, status: 404 }));
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getMovies], [movie]);
    renderWithProviders(<MovieCard movie={movie} />, { queryClient });

    await user.click(screen.getByLabelText('Mark watched'));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not found' }));
      expect(queryClient.getQueryData([QueryKey.getMovies])).toEqual([movie]);
    });
  });

  it('unsubscribes when confirm modal is confirmed', async () => {
    const { openConfirmModal } = await import('@mantine/modals');
    vi.mocked(openConfirmModal).mockImplementation(({ onConfirm }) => {
      onConfirm?.();
      return 'test-modal-id';
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([QueryKey.getMovies], [movie]);
    renderWithProviders(<MovieCard movie={movie} />, { queryClient });

    await user.click(screen.getByLabelText('Unsubscribe'));

    await waitFor(() => {
      expect(openConfirmModal).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(apiRoutes.movieById(movie.id), { method: 'delete' });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Card Movie') }),
      );
    });
  });
});
