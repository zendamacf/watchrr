import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecommendationDetails } from '@/lib/recommendations/types';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testRecommendation, testShowRecommendation } from '@/test/fixtures/recommendation';
import { renderWithProviders } from '@/test/render';
import { RecommendationDetailsModal } from './RecommendationDetailsModal';

const details: RecommendationDetails = {
  tagline: 'Just a tagline',
  genres: ['Crime', 'Thriller'],
  rating: 8.5,
  votes: 12345,
  runtime: 154,
  seasons: null,
  status: 'Released',
  cast: [
    { name: 'John Travolta', character: 'Vincent Vega', photo: null },
    { name: 'Uma Thurman', character: null, photo: null },
  ],
  trailer: 'abc123',
  providers: [{ name: 'Neon', logo: '/neon.jpg' }],
  providers_link: 'https://www.themoviedb.org/movie/680/watch',
};

const setup = (recommendation = testRecommendation) => {
  const props = { onClose: vi.fn(), onAdd: vi.fn(), onHide: vi.fn() };
  renderWithProviders(<RecommendationDetailsModal recommendation={recommendation} {...props} />);
  return props;
};

describe('RecommendationDetailsModal', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { language: 'en-NZ' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing and makes no request while closed', () => {
    stubFetch(mockFetchResponse(details));
    renderWithProviders(
      <RecommendationDetailsModal recommendation={null} onClose={vi.fn()} onAdd={vi.fn()} onHide={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows the synopsis straight away and a loading state for the rest', async () => {
    stubFetch(() => new Promise<Response>(() => {}));
    setup();

    expect(await screen.findByText('A recommended movie')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading details' })).toBeInTheDocument();
  });

  it('shows rating, genres, runtime, cast, streaming and the trailer link', async () => {
    stubFetch(mockFetchResponse(details));
    setup();

    expect(await screen.findByText('Just a tagline')).toBeInTheDocument();
    expect(screen.getByText(/8\.5/)).toBeInTheDocument();
    expect(screen.getByText('Crime')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
    expect(screen.getByText('2h 34m · Released')).toBeInTheDocument();
    expect(screen.getByText(/John Travolta, Uma Thurman/)).toBeInTheDocument();
    expect(screen.getByText('Neon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'JustWatch' })).toHaveAttribute('href', details.providers_link);
    expect(screen.getByRole('link', { name: 'Watch trailer' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=abc123',
    );
  });

  it('formats whole hours, short runtimes and season counts', async () => {
    stubFetch(mockFetchResponse({ ...details, runtime: 120, seasons: 1, status: null }));
    setup();
    expect(await screen.findByText('2h · 1 season')).toBeInTheDocument();
  });

  it('formats minutes only and several seasons', async () => {
    stubFetch(mockFetchResponse({ ...details, runtime: 45, seasons: 5, status: null }));
    setup(testShowRecommendation);
    expect(await screen.findByText('45m · 5 seasons')).toBeInTheDocument();
  });

  it('leaves out sections TMDB has nothing for', async () => {
    stubFetch(
      mockFetchResponse({
        ...details,
        tagline: null,
        rating: null,
        runtime: null,
        status: null,
        cast: [],
        trailer: null,
        providers: [],
        providers_link: null,
        genres: [],
      }),
    );
    setup();

    await screen.findByText('A recommended movie');
    await vi.waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(screen.queryByText('Starring')).not.toBeInTheDocument();
    expect(screen.queryByText('Streaming on')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Watch trailer' })).not.toBeInTheDocument();
  });

  it('credits JustWatch without a link when TMDB gave none', async () => {
    stubFetch(mockFetchResponse({ ...details, providers_link: null }));
    setup();

    expect(await screen.findByText(/Availability from/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'JustWatch' })).not.toBeInTheDocument();
  });

  it('says when there is no synopsis', async () => {
    stubFetch(mockFetchResponse(details));
    setup({ ...testRecommendation, description: null });
    expect(await screen.findByText('No synopsis available.')).toBeInTheDocument();
  });

  it('keeps the synopsis and actions when the details fail to load', async () => {
    stubFetch(mockFetchResponse({ message: 'Could not load details from TMDB' }, { ok: false, status: 502 }));
    setup();

    expect(await screen.findByText(/Could not load more details/, undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('A recommended movie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('adds and closes', async () => {
    stubFetch(mockFetchResponse(details));
    const user = userEvent.setup();
    const props = setup();

    await user.click(await screen.findByRole('button', { name: 'Add' }));

    expect(props.onAdd).toHaveBeenCalledWith(testRecommendation);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('hides and closes', async () => {
    stubFetch(mockFetchResponse(details));
    const user = userEvent.setup();
    const props = setup();

    await user.click(await screen.findByRole('button', { name: 'Not interested' }));

    expect(props.onHide).toHaveBeenCalledWith(testRecommendation, 'not_interested');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('marks as already watched and closes', async () => {
    stubFetch(mockFetchResponse(details));
    const user = userEvent.setup();
    const props = setup();

    await user.click(await screen.findByRole('button', { name: 'Already watched' }));

    expect(props.onHide).toHaveBeenCalledWith(testRecommendation, 'already_watched');
    expect(props.onClose).toHaveBeenCalled();
  });
});
