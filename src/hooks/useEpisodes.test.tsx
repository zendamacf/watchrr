import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testSubscription } from '@/test/fixtures/subscription';
import { testShow } from '@/test/fixtures/tvshow';
import { renderHookWithProviders } from '@/test/renderHook';
import type { EpisodesResponse } from '@/types';
import { useSnoozedEpisodeCount } from './useEpisodes';

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
    stubFetch(mockFetchResponse([snoozedEpisode, snoozedEpisode, scheduledEpisode]));
    const { result } = renderHookWithProviders(() => useSnoozedEpisodeCount());

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
  });

  it('returns zero when there are no snoozed episodes', async () => {
    stubFetch(mockFetchResponse([scheduledEpisode]));
    const { result } = renderHookWithProviders(() => useSnoozedEpisodeCount());

    await waitFor(() => {
      expect(result.current).toBe(0);
    });
  });
});
