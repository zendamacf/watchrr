import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { testRecommendation, testShowRecommendation } from '@/test/fixtures/recommendation';
import { renderWithProviders } from '@/test/render';
import { RecommendationCard } from './RecommendationCard';

describe('RecommendationCard', () => {
  it('shows the title, release year and why it was recommended for a movie', () => {
    renderWithProviders(<RecommendationCard recommendation={testRecommendation} onAdd={vi.fn()} onHide={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Pulp Fiction' })).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText('Because you watch Fight Club')).toBeInTheDocument();
  });

  it('falls back to a plain label when a movie has no release date', () => {
    renderWithProviders(
      <RecommendationCard
        recommendation={{ ...testRecommendation, releasedate: null }}
        onAdd={vi.fn()}
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('Movie')).toBeInTheDocument();
  });

  it('shows the country for a show, or a plain label without one', () => {
    const { unmount } = renderWithProviders(
      <RecommendationCard recommendation={testShowRecommendation} onAdd={vi.fn()} onHide={vi.fn()} />,
    );
    expect(screen.getByText('Show · US')).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <RecommendationCard
        recommendation={{ ...testShowRecommendation, country: null }}
        onAdd={vi.fn()}
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('calls onAdd and onHide with the recommendation', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onHide = vi.fn();
    renderWithProviders(<RecommendationCard recommendation={testRecommendation} onAdd={onAdd} onHide={onHide} />);

    await user.click(screen.getByRole('button', { name: 'Add Pulp Fiction' }));
    await user.click(screen.getByRole('button', { name: 'Not interested in Pulp Fiction' }));

    expect(onAdd).toHaveBeenCalledWith(testRecommendation);
    expect(onHide).toHaveBeenCalledWith(testRecommendation);
  });

  it('disables hiding while busy', () => {
    renderWithProviders(
      <RecommendationCard recommendation={testRecommendation} onAdd={vi.fn()} onHide={vi.fn()} busy />,
    );
    expect(screen.getByRole('button', { name: 'Not interested in Pulp Fiction' })).toBeDisabled();
  });
});
