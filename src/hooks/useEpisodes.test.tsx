import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPagedResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testSubscription } from '@/test/fixtures/subscription';
import { testShow } from '@/test/fixtures/tvshow';
import { renderHookWithProviders } from '@/test/renderHook';
import type { EpisodesResponse } from '@/types';
import { useSnoozedEpisodeCount, useSnoozedEpisodes } from './useEpisodes';

const snoozedEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, id: '00000000-0000-4000-8000-000000000091', name: 'Snoozed Pilot' },
  tvshows: testShow,
  subscription: { delay_days: 0, snoozed_until: '2099-12-01' },
};

const scheduledEpisode: EpisodesResponse[number] = {
  episodes: { ...testEpisode, id: '00000000-0000-4000-8000-000000000092', name: 'Scheduled Pilot' },
  tvshows: testShow,
  subscription: testSubscription,
};

describe('useSnoozedEpisodeCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the number of snoozed unwatched episodes', async () => {
    stubFetch(mockPagedResponse([snoozedEpisode, snoozedEpisode], 2));
    const { result } = renderHookWithProviders(() => useSnoozedEpisodeCount());

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
  });

  it('returns zero when there are no snoozed episodes', async () => {
    stubFetch(mockPagedResponse([], 0));
    const { result } = renderHookWithProviders(() => useSnoozedEpisodeCount());

    await waitFor(() => {
      expect(result.current).toBe(0);
    });
  });
});

describe('useSnoozedEpisodes', () => {
  it('requests only snoozed episodes from the API', async () => {
    stubFetch(mockPagedResponse([snoozedEpisode], 1));
    const { result } = renderHookWithProviders(() => useSnoozedEpisodes());

    await waitFor(() => expect(result.current.episodes).toHaveLength(1));
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain('snoozed=true');
  });

  it('loads the next page and reports whether more remain', async () => {
    const second = { ...snoozedEpisode, episodes: { ...snoozedEpisode.episodes, id: 'second' } };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(mockPagedResponse([snoozedEpisode], 2))
        .mockResolvedValueOnce(mockPagedResponse([second], 2)),
    );
    const { result } = renderHookWithProviders(() => useSnoozedEpisodes());

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    expect(result.current.total).toBe(2);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.episodes).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
    expect(String(vi.mocked(fetch).mock.calls[1]?.[0])).toContain('offset=1');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only snoozed episodes', async () => {
    stubFetch(mockPagedResponse([snoozedEpisode, snoozedEpisode], 2));
    const { result } = renderHookWithProviders(() => useSnoozedEpisodes());

    await waitFor(() => {
      expect(result.current.episodes).toHaveLength(2);
      expect(result.current.episodes.every((row) => row.subscription.snoozed_until)).toBe(true);
    });
  });
});
