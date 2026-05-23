import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AddMediaModal } from './AddMediaModal';

type SearchResult = { id: number; name: string };

describe('AddMediaModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows search prompt when opened without a query', () => {
    renderWithProviders(
      <AddMediaModal<SearchResult>
        opened
        onClose={() => {}}
        title="Add movie"
        queryKey="test-search"
        queryFn={vi.fn()}
        builder={(item) => <div key={item.id}>{item.name}</div>}
      />,
    );

    expect(screen.getByText(/Search above to get started/i)).toBeInTheDocument();
  });

  it('searches and renders results from queryFn', async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 1, name: 'Inception' }]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <AddMediaModal<SearchResult>
        opened
        onClose={() => {}}
        title="Add movie"
        queryKey="test-search-movies"
        queryFn={queryFn}
        builder={(item) => <div key={item.id}>{item.name}</div>}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search'), 'incep');
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith('incep');
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
  });
});
