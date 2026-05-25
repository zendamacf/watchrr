import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import type { EpisodesResponse } from '@/types';
import { EpisodeList } from './EpisodeList';

vi.mock('./PastEpisodes', () => ({
  PastEpisodes: ({ episodes }: { episodes: unknown[] }) => (
    <div data-testid="past-episodes">{episodes.length} past</div>
  ),
}));

vi.mock('./GroupedEpisodes', () => ({
  GroupedEpisodes: () => <div data-testid="grouped-episodes" />,
}));

const futureEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, airdate: '2099-12-01', name: 'Future Pilot' },
  tvshows: { ...testShow, name: 'Future Show', country: 'US' },
};

const pastEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, id: '00000000-0000-4000-8000-000000000090', airdate: '2020-01-01', name: 'Old Pilot' },
  tvshows: { ...testShow, name: 'Past Show', country: 'US' },
};

describe('EpisodeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loader while episodes are loading', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    const { container } = renderWithProviders(<EpisodeList />);
    expect(container.querySelector('.mantine-Loader-root')).toBeTruthy();
  });

  it('shows an error when the episodes request fails', async () => {
    stubFetch(mockFetchResponse({ message: 'fail' }, { ok: false, status: 500 }));
    renderWithProviders(<EpisodeList />);
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('groups past and future episodes and filters by search', async () => {
    stubFetch(mockFetchResponse([pastEpisode, futureEpisode]));
    const user = userEvent.setup();
    renderWithProviders(<EpisodeList />);

    await waitFor(() => {
      expect(screen.getByTestId('past-episodes')).toHaveTextContent('1 past');
      expect(screen.getByTestId('grouped-episodes')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search'), 'future');
    await waitFor(() => {
      expect(screen.queryByTestId('past-episodes')).not.toBeInTheDocument();
      expect(screen.getByTestId('grouped-episodes')).toBeInTheDocument();
    });
  });
});
