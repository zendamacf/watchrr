import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testMovie } from '@/test/fixtures/movie';
import { renderWithProviders } from '@/test/render';
import { MoviePage } from './MoviePage';

vi.mock('./MovieList', () => ({
  MovieList: ({ movies }: { movies: { name: string }[] }) => (
    <div data-testid="movie-list">{movies.map((m) => m.name).join(',')}</div>
  ),
}));

vi.mock('./AddMovieModal', () => ({
  AddMovieModal: () => null,
}));

vi.mock('@/components/FloatingButton', () => ({
  FloatingButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Add
    </button>
  ),
}));

describe('MoviePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loader while movies are loading', () => {
    stubFetch(() => new Promise(() => {}));
    const { container } = renderWithProviders(<MoviePage />);
    expect(container.querySelector('.mantine-Loader-root')).toBeTruthy();
  });

  it('shows an error when the movies request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<MoviePage />);
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('renders movies and filters by search', async () => {
    const movies = [
      { ...testMovie, id: '00000000-0000-4000-8000-000000000095', name: 'Alpha Movie' },
      { ...testMovie, id: '00000000-0000-4000-8000-000000000096', name: 'Beta Film' },
    ];
    stubFetch(mockFetchResponse(movies));
    const user = userEvent.setup();
    renderWithProviders(<MoviePage />);

    await waitFor(() => {
      expect(screen.getByTestId('movie-list')).toHaveTextContent('Alpha Movie,Beta Film');
    });

    await user.type(screen.getByPlaceholderText('Search'), 'alpha');
    await waitFor(() => {
      expect(screen.getByTestId('movie-list')).toHaveTextContent('Alpha Movie');
      expect(screen.getByTestId('movie-list')).not.toHaveTextContent('Beta Film');
    });
  });
});
