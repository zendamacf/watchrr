import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { testMovie } from '@/test/fixtures/movie';
import { renderWithProviders } from '@/test/render';
import { MovieList } from './MovieList';

vi.mock('./MovieCard', () => ({
  MovieCard: ({ movie }: { movie: { name: string } }) => <div data-testid="movie-card">{movie.name}</div>,
}));

describe('MovieList', () => {
  it('renders a card per movie', () => {
    const movies = [
      { ...testMovie, id: '00000000-0000-4000-8000-000000000091', name: 'Alpha' },
      { ...testMovie, id: '00000000-0000-4000-8000-000000000092', name: 'Beta' },
    ];
    renderWithProviders(<MovieList movies={movies} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByTestId('movie-card')).toHaveLength(2);
  });
});
