import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { ShowList } from './ShowList';

vi.mock('./ShowCard', () => ({
  ShowCard: ({ show }: { show: { name: string } }) => <div data-testid="show-card">{show.name}</div>,
}));

describe('ShowList', () => {
  it('renders a card per show', () => {
    const shows = [
      { ...testShow, id: '00000000-0000-4000-8000-000000000093', name: 'Show A' },
      { ...testShow, id: '00000000-0000-4000-8000-000000000094', name: 'Show B' },
    ];
    renderWithProviders(<ShowList shows={shows} />);
    expect(screen.getByText('Show A')).toBeInTheDocument();
    expect(screen.getByText('Show B')).toBeInTheDocument();
    expect(screen.getAllByTestId('show-card')).toHaveLength(2);
  });
});
