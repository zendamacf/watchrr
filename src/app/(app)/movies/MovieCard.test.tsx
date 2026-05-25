import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { toPublicMovie } from '@/lib/db/public-media';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testMovie } from '@/test/fixtures/movie';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import type { MoviePublic } from '@/types';
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

const movie: MoviePublic = toPublicMovie({ ...testMovie, id: 88_001, name: 'Card Movie' });

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
      expect(fetch).toHaveBeenCalledWith(apiRoutes.movieById(movie.uuid), { method: 'put' });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Card Movie') }),
      );
    });
  });
});
