import { screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { testMovie } from '@/test/fixtures/movie';
import { renderWithProviders } from '@/test/render';
import { BaseMovieCard } from './BaseMovieCard';

const baseMovie = {
  ...testMovie,
  releaseDate: DateTime.fromSQL('2020-01-01'),
};

describe('BaseMovieCard', () => {
  it('renders title and description when enabled', () => {
    renderWithProviders(<BaseMovieCard movie={baseMovie} description releaseDate />);
    expect(screen.getByRole('heading', { name: testMovie.name })).toBeInTheDocument();
    expect(screen.getByText(testMovie.description!)).toBeInTheDocument();
    expect(screen.getByText('01/01/2020')).toBeInTheDocument();
  });

  it('shows unknown release date when releaseDate flag is on but date is null', () => {
    renderWithProviders(<BaseMovieCard movie={{ ...testMovie, releaseDate: null }} releaseDate description={false} />);
    expect(screen.getByText('Unknown release date')).toBeInTheDocument();
  });

  it('renders custom actions', () => {
    renderWithProviders(
      <BaseMovieCard movie={{ ...testMovie, releaseDate: null }} actions={<button type="button">Act</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument();
  });

  it('omits release line when releaseDate prop is false', () => {
    renderWithProviders(<BaseMovieCard movie={baseMovie} releaseDate={false} />);
    expect(screen.queryByText('01/01/2020')).not.toBeInTheDocument();
  });
});
