import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryKey } from '@/components/QueryProvider';
import { apiRoutes } from '@/lib/routes';
import { mockFetchResponse, stubFetch } from '@/test/fetch';
import { testEpisode } from '@/test/fixtures/episode';
import { testShow } from '@/test/fixtures/tvshow';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import type { EpisodesResponse, ShowEpisodesResponse, SubscribedShow } from '@/types';
import { ShowOptionsForm } from './ShowOptionsForm';

const { mockShowError, mockShowSuccess } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showInfo: vi.fn(),
    showLoading: vi.fn(),
    doneLoadingSuccess: vi.fn(),
    doneLoadingInfo: vi.fn(),
    doneLoadingError: vi.fn(),
  }),
}));

const baseShow: SubscribedShow = {
  ...testShow,
  delay_days: 0,
  snoozed_until: null,
};

describe('ShowOptionsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch(mockFetchResponse({ delay_days: 14, snoozed_until: null }));
  });

  it('saves delay preferences when enabled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowOptionsForm show={baseShow} />);

    await user.click(screen.getByLabelText('Enable delay'));
    await user.click(screen.getByRole('button', { name: '14 days' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        apiRoutes.tvshowPreferences(baseShow.id),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ delay_days: 14, snoozed_until: null }),
        }),
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(baseShow.name) }),
      );
    });
  });

  it('saves snooze preferences with a preset duration', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowOptionsForm show={baseShow} />);

    await user.click(screen.getByLabelText('Snooze this show'));
    await user.click(screen.getByRole('radio', { name: '2 weeks' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const expectedDate = DateTime.now().startOf('day').plus({ weeks: 2 }).toFormat('yyyy-MM-dd');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        apiRoutes.tvshowPreferences(baseShow.id),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ delay_days: 0, snoozed_until: expectedDate }),
        }),
      );
    });
  });

  it('saves snooze preferences with a custom date', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowOptionsForm show={baseShow} />);

    await user.click(screen.getByLabelText('Snooze this show'));
    await user.click(screen.getByRole('radio', { name: 'Custom' }));
    await user.clear(screen.getByLabelText('Snooze until'));
    await user.type(screen.getByLabelText('Snooze until'), '2099-06-15');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        apiRoutes.tvshowPreferences(baseShow.id),
        expect.objectContaining({
          body: JSON.stringify({ delay_days: 0, snoozed_until: '2099-06-15' }),
        }),
      );
    });
  });

  it('initialises from existing show preferences', async () => {
    const show: SubscribedShow = {
      ...baseShow,
      delay_days: 21,
      snoozed_until: DateTime.now().startOf('day').plus({ weeks: 1 }).toFormat('yyyy-MM-dd'),
    };

    renderWithProviders(<ShowOptionsForm show={show} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Enable delay')).toBeChecked();
      expect(screen.getByLabelText('Snooze this show')).toBeChecked();
      expect(screen.getByRole('radio', { name: '1 week' })).toBeChecked();
    });
  });

  it('updates cached episodes and show detail after a successful save', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const episodes: EpisodesResponse = [
      {
        episodes: { ...testEpisode, tvshow_id: baseShow.id },
        tvshows: baseShow,
        subscription: { delay_days: 0, snoozed_until: null },
      },
    ];
    const showDetail: ShowEpisodesResponse = {
      tvshow: baseShow,
      subscription: { delay_days: 0, snoozed_until: null },
      episodes: [],
    };
    queryClient.setQueryData([QueryKey.getEpisodes], episodes);
    queryClient.setQueryData([QueryKey.getShowEpisodes, baseShow.id], showDetail);

    renderWithProviders(<ShowOptionsForm show={baseShow} />, { queryClient });

    await user.click(screen.getByLabelText('Enable delay'));
    await user.click(screen.getByRole('button', { name: '7 days' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const cached = queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes]);
      expect(cached?.[0]?.subscription.delay_days).toBe(14);
      const detail = queryClient.getQueryData<ShowEpisodesResponse>([QueryKey.getShowEpisodes, baseShow.id]);
      expect(detail?.subscription.delay_days).toBe(14);
    });
  });

  it('shows an error when saving fails', async () => {
    stubFetch(mockFetchResponse({ message: 'Forbidden' }, { ok: false, status: 403 }));
    const user = userEvent.setup();
    renderWithProviders(<ShowOptionsForm show={baseShow} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Forbidden' }));
    });
  });
});
