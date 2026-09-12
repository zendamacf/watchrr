'use client';

import {
  ActionIcon,
  Badge,
  CopyButton,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import classNames from 'classnames';
import { AlarmClock, Check, ClipboardCheck, Copy, Settings } from 'lucide-react';
import { DateTime } from 'luxon';
import { BackdropCard } from '@/components/BackdropCard';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse, SubscribedShow } from '@/types';
import { DateFormat } from '@/utils/dates';
import { ShowOptionsModal } from '../shows/ShowOptionsModal';
import classes from './EpisodeCard.module.css';
import type { ParsedEpisode } from './types';

type Props = {
  episode: ParsedEpisode;
  showDate?: boolean;
  variant?: 'scheduled' | 'snoozed';
};

type MutationContext = { previousEpisodes: EpisodesResponse | undefined };

export const EpisodeCard = ({ episode, showDate, variant = 'scheduled' }: Props) => {
  const { showError, showSuccess, showInfo } = useAlert();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  const episodeNumber = `S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`;
  const subscribedShow: SubscribedShow = {
    ...episode.tvshows,
    delay_days: episode.subscription.delay_days,
    snoozed_until: episode.subscription.snoozed_until,
  };

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation<unknown, Error, string, MutationContext>({
    mutationFn: async (episodeId) => {
      const response = await apiFetch(apiRoutes.episodeById(episodeId), { method: 'put' });
      if (!response.ok) throw new Error((await response.json()).message);
    },
    onMutate: async (episodeId) => {
      await queryClient.cancelQueries({ queryKey: [QueryKey.getEpisodes] });
      const previousEpisodes = queryClient.getQueryData<EpisodesResponse>([QueryKey.getEpisodes]);
      queryClient.setQueryData<EpisodesResponse>([QueryKey.getEpisodes], (old) =>
        old?.filter((o) => o.episodes.id !== episodeId),
      );
      showSuccess({
        title: 'Nice!',
        message: `You watched ${episode.tvshows.name} ${episodeNumber}`,
      });
      return { previousEpisodes };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] }),
    onError(error, _vars, context) {
      showError({ title: 'An error occurred', message: error.message });
      queryClient.setQueryData([QueryKey.getEpisodes], context?.previousEpisodes);
    },
  });

  const { mutate: wakeShow, isPending: wakePending } = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(apiRoutes.tvshowPreferences(episode.tvshows.id), {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snoozed_until: null }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      showSuccess({ title: 'Awake!', message: `${episode.tvshows.name} is back on your schedule` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShows] });
    },
    onError: (error: Error) => showError({ title: 'An error occurred', message: error.message }),
  });

  const showDelayBadge = variant === 'scheduled' && episode.episodes.delay_days > 0;
  const showSnoozedBadge = variant === 'snoozed' && episode.episodes.snoozed_until;

  return (
    <>
      <ShowOptionsModal show={subscribedShow} opened={settingsOpened} onClose={closeSettings} />
      <BackdropCard key={episode.episodes.id} style={{ width: '100%' }} backdrop={episode.tvshows.backdrop_slug}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Title order={3} lineClamp={1} style={{ flex: 1 }}>
            {episode.tvshows.name}
          </Title>
          <Group gap="xs">
            {showDelayBadge && (
              <Popover width="unset">
                <PopoverTarget>
                  <Badge color="blue" variant="outline" style={{ cursor: 'help' }}>
                    {episode.episodes.delay_days}d delay
                  </Badge>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text size="sm">
                    Originally aired {episode.episodes.original_local_date.toFormat(DateFormat.DOW_DMY)}
                  </Text>
                </PopoverDropdown>
              </Popover>
            )}
            {showSnoozedBadge && (
              <Badge color="orange" variant="outline">
                Snoozed until {DateTime.fromSQL(episode.episodes.snoozed_until!).toFormat(DateFormat.DMY)}
              </Badge>
            )}
          </Group>
        </Group>
        <Group justify={'space-between'} align={'flex-end'}>
          <Stack gap={0}>
            <Text fw={'bold'}>{episodeNumber}</Text>
            <Text>{episode.episodes.name}</Text>
            {showDate && (
              <Text className={classNames({ [classes.pastdate!]: episode.episodes.in_past })}>
                {episode.episodes.local_date.toFormat(DateFormat.DOW_DMY)}
              </Text>
            )}
          </Stack>
          <Group justify={'end'} gap={'xs'}>
            {variant === 'snoozed' && (
              <>
                <ActionIcon aria-label="Show settings" variant="outline" onClick={openSettings}>
                  <Settings size={'20'} />
                </ActionIcon>
                <ActionIcon
                  aria-label="Wake show"
                  variant="outline"
                  color="orange"
                  loading={wakePending}
                  onClick={() => wakeShow()}
                >
                  <AlarmClock size={'20'} />
                </ActionIcon>
              </>
            )}
            <CopyButton value={`${episode.tvshows.name} ${episodeNumber}`} timeout={2000}>
              {({ copied, copy }) => (
                <ActionIcon
                  variant={'outline'}
                  color={copied ? 'blue' : 'grey'}
                  onClick={() => {
                    copy();
                    showInfo({ message: 'Copied', icon: <ClipboardCheck /> });
                  }}
                >
                  {copied ? <ClipboardCheck size={'20'} /> : <Copy size={'20'} />}
                </ActionIcon>
              )}
            </CopyButton>
            <ActionIcon loading={isPending} onClick={() => mutate(episode.episodes.id)}>
              <Check size={'20'} />
            </ActionIcon>
          </Group>
        </Group>
      </BackdropCard>
    </>
  );
};
