import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { testRecommendation, testShowRecommendation } from '@/test/fixtures/recommendation';
import { renderWithProviders } from '@/test/render';
import { RecommendationCard } from './RecommendationCard';

describe('RecommendationCard', () => {
  it('shows the title, release year and why it was recommended for a movie', () => {
    renderWithProviders(
      <RecommendationCard recommendation={testRecommendation} onAdd={vi.fn()} onInfo={vi.fn()} onHide={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'Pulp Fiction' })).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText(/Because you watch/)).toBeInTheDocument();
    expect(screen.getByText('Fight Club').tagName).toBe('STRONG');
  });

  describe('reasons', () => {
    const reasons = (because: string[], because_more = 0) =>
      renderWithProviders(
        <RecommendationCard
          recommendation={{ ...testRecommendation, because, because_more }}
          onAdd={vi.fn()}
          onInfo={vi.fn()}
          onHide={vi.fn()}
        />,
      );
    const sentence = () => screen.getByText(/Because you watch/).textContent;

    it('emphasises each source and joins two with "and"', () => {
      reasons(['Fight Club', 'Se7en']);
      expect(screen.getByText('Fight Club').tagName).toBe('STRONG');
      expect(screen.getByText('Se7en').tagName).toBe('STRONG');
      expect(sentence()).toBe('Because you watch Fight Club and Se7en');
    });

    it('uses commas, then "and", for three sources', () => {
      reasons(['Fight Club', 'Se7en', 'Zodiac']);
      expect(sentence()).toBe('Because you watch Fight Club, Se7en and Zodiac');
    });

    it('ends with the number of further sources, not highlighted', () => {
      reasons(['Fight Club', 'Se7en', 'Zodiac'], 4);
      expect(sentence()).toBe('Because you watch Fight Club, Se7en, Zodiac and 4 more');
      expect(screen.getByText('4 more').tagName).not.toBe('STRONG');
    });

    it('works with one source and further ones', () => {
      reasons(['Fight Club'], 1);
      expect(sentence()).toBe('Because you watch Fight Club and 1 more');
    });

    it('names a repeated title once', () => {
      reasons(['Dune', 'Dune', 'Arrival']);
      expect(screen.getAllByText('Dune')).toHaveLength(1);
      expect(sentence()).toBe('Because you watch Dune and Arrival');
    });
  });

  it('falls back to a plain label when a movie has no release date', () => {
    renderWithProviders(
      <RecommendationCard
        recommendation={{ ...testRecommendation, releasedate: null }}
        onAdd={vi.fn()}
        onInfo={vi.fn()}
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('Movie')).toBeInTheDocument();
  });

  it('shows the country for a show, or a plain label without one', () => {
    const { unmount } = renderWithProviders(
      <RecommendationCard recommendation={testShowRecommendation} onAdd={vi.fn()} onInfo={vi.fn()} onHide={vi.fn()} />,
    );
    expect(screen.getByText('Show · US')).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <RecommendationCard
        recommendation={{ ...testShowRecommendation, country: null }}
        onAdd={vi.fn()}
        onInfo={vi.fn()}
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('calls onAdd and onHide with the recommendation', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onHide = vi.fn();
    const onInfo = vi.fn();
    renderWithProviders(
      <RecommendationCard recommendation={testRecommendation} onAdd={onAdd} onHide={onHide} onInfo={onInfo} />,
    );

    await user.click(screen.getByRole('button', { name: 'More about Pulp Fiction' }));
    await user.click(screen.getByRole('button', { name: 'Add Pulp Fiction' }));
    await user.click(screen.getByRole('button', { name: 'Not interested in Pulp Fiction' }));
    await user.click(screen.getByRole('button', { name: 'Already watched Pulp Fiction' }));

    expect(onAdd).toHaveBeenCalledWith(testRecommendation);
    expect(onHide).toHaveBeenNthCalledWith(1, testRecommendation, 'not_interested');
    expect(onHide).toHaveBeenNthCalledWith(2, testRecommendation, 'already_watched');
  });

  it('disables hiding while busy', () => {
    renderWithProviders(
      <RecommendationCard recommendation={testRecommendation} onAdd={vi.fn()} onInfo={vi.fn()} onHide={vi.fn()} busy />,
    );
    expect(screen.getByRole('button', { name: 'Not interested in Pulp Fiction' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Already watched Pulp Fiction' })).toBeDisabled();
  });
});
