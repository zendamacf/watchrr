import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { ShowPage } from './ShowPage';

vi.mock('./ShowList', () => ({
  ShowList: ({ shows }: { shows: { name: string }[] }) => (
    <div data-testid="show-list">{shows.map((s) => s.name).join(',')}</div>
  ),
}));

vi.mock('./AddShowModal', () => ({
  AddShowModal: () => null,
}));

vi.mock('@/components/FloatingButton', () => ({
  FloatingButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Add
    </button>
  ),
}));

describe('ShowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loader while shows are loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    const { container } = renderWithProviders(<ShowPage />);
    expect(container.querySelector('.mantine-Loader-root')).toBeTruthy();
  });

  it('shows an error when the shows request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<ShowPage />);
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('renders shows and filters by search', async () => {
    const shows = [
      { ...testShow, id: '00000000-0000-4000-8000-000000000097', name: 'Alpha Show' },
      { ...testShow, id: '00000000-0000-4000-8000-000000000098', name: 'Beta Series' },
    ];
    stubFetch(mockFetchResponse(shows));
    const user = userEvent.setup();
    renderWithProviders(<ShowPage />);

    await waitFor(() => {
      expect(screen.getByTestId('show-list')).toHaveTextContent('Alpha Show,Beta Series');
    });

    await user.type(screen.getByPlaceholderText('Search'), 'beta');
    await waitFor(() => {
      expect(screen.getByTestId('show-list')).toHaveTextContent('Beta Series');
      expect(screen.getByTestId('show-list')).not.toHaveTextContent('Alpha Show');
    });
  });
});
