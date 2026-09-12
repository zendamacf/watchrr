'use client';

import {
  Button,
  Divider,
  Group,
  Modal,
  type ModalProps,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { EpisodesResponse, ShowSubscription, SubscribedShow } from '@/types';
import { DELAY_UI_COLOR, MAX_DELAY_DAYS, SNOOZE_UI_COLOR } from '@/utils/episode-schedule';

type Props = {
  show: SubscribedShow;
} & ModalProps;

const DELAY_PRESETS = [7, 14, 21] as const;
type SnoozePreset = '1w' | '2w' | '1m' | 'custom';

function snoozeDateForPreset(preset: SnoozePreset): string {
  const now = DateTime.now().startOf('day');
  switch (preset) {
    case '1w':
      return now.plus({ weeks: 1 }).toFormat('yyyy-MM-dd');
    case '2w':
      return now.plus({ weeks: 2 }).toFormat('yyyy-MM-dd');
    case '1m':
      return now.plus({ months: 1 }).toFormat('yyyy-MM-dd');
    default:
      return now.plus({ weeks: 1 }).toFormat('yyyy-MM-dd');
  }
}

function detectSnoozePreset(snoozedUntil: string | null): SnoozePreset {
  if (!snoozedUntil) return '1w';
  const target = DateTime.fromSQL(snoozedUntil).startOf('day');
  const now = DateTime.now().startOf('day');
  const diffDays = target.diff(now, 'days').days;
  if (diffDays >= 27 && diffDays <= 32) return '1m';
  if (diffDays >= 13 && diffDays <= 15) return '2w';
  if (diffDays >= 6 && diffDays <= 8) return '1w';
  return 'custom';
}

export const ShowOptionsModal = ({ show, opened, onClose, ...props }: Props) => {
  const { showError, showSuccess } = useAlert();
  const queryClient = useQueryClient();

  const [delayEnabled, setDelayEnabled] = useState(show.delay_days > 0);
  const [delayDays, setDelayDays] = useState(show.delay_days);
  const [snoozeEnabled, setSnoozeEnabled] = useState(!!show.snoozed_until);
  const [snoozePreset, setSnoozePreset] = useState<SnoozePreset>(detectSnoozePreset(show.snoozed_until));
  const [customSnoozeDate, setCustomSnoozeDate] = useState(show.snoozed_until ?? snoozeDateForPreset('1w'));

  useEffect(() => {
    if (!opened) return;
    setDelayEnabled(show.delay_days > 0);
    setDelayDays(show.delay_days);
    setSnoozeEnabled(!!show.snoozed_until);
    setSnoozePreset(detectSnoozePreset(show.snoozed_until));
    setCustomSnoozeDate(show.snoozed_until ?? snoozeDateForPreset('1w'));
  }, [opened, show]);

  const { mutate, isPending } = useMutation<ShowSubscription, Error, ShowSubscription>({
    mutationFn: async (preferences) => {
      const response = await apiFetch(apiRoutes.tvshowPreferences(show.id), {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      return json as ShowSubscription;
    },
    onSuccess: (preferences) => {
      showSuccess({ title: 'Saved', message: `Updated options for ${show.name}` });
      queryClient.setQueryData<EpisodesResponse>([QueryKey.getEpisodes], (old) =>
        old?.map((row) => (row.tvshows.id === show.id ? { ...row, subscription: preferences } : row)),
      );
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShows] });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getEpisodes] });
      onClose();
    },
    onError: (error) => showError({ title: 'An error occurred', message: error.message }),
  });

  const handleSave = () => {
    const preferences: ShowSubscription = {
      delay_days: delayEnabled ? delayDays : 0,
      snoozed_until: snoozeEnabled
        ? snoozePreset === 'custom'
          ? customSnoozeDate
          : snoozeDateForPreset(snoozePreset)
        : null,
    };
    mutate(preferences);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={show.name} centered {...props}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Text fw={600}>Release delay</Text>
          <Text size="sm" c="dimmed">
            Wait a number of days after the listed air date before episodes appear on your schedule.
          </Text>
          <Switch
            label="Enable delay"
            color={DELAY_UI_COLOR}
            checked={delayEnabled}
            onChange={(event) => setDelayEnabled(event.currentTarget.checked)}
          />
          {delayEnabled && (
            <Stack gap="xs">
              <NumberInput
                label="Days"
                value={delayDays}
                onChange={(value) => setDelayDays(typeof value === 'number' ? value : 0)}
                min={0}
                max={MAX_DELAY_DAYS}
              />
              <Group gap="xs">
                {DELAY_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant="light"
                    color={DELAY_UI_COLOR}
                    size="xs"
                    onClick={() => setDelayDays(preset)}
                  >
                    {preset} days
                  </Button>
                ))}
              </Group>
            </Stack>
          )}
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Text fw={600}>Snooze</Text>
          <Text size="sm" c="dimmed">
            Hide all unwatched episodes until a date.
          </Text>
          <Switch
            label="Snooze this show"
            color={SNOOZE_UI_COLOR}
            checked={snoozeEnabled}
            onChange={(event) => setSnoozeEnabled(event.currentTarget.checked)}
          />
          {snoozeEnabled && (
            <Stack gap="xs">
              <SegmentedControl
                color={SNOOZE_UI_COLOR}
                value={snoozePreset}
                onChange={(value) => setSnoozePreset(value as SnoozePreset)}
                data={[
                  { label: '1 week', value: '1w' },
                  { label: '2 weeks', value: '2w' },
                  { label: '1 month', value: '1m' },
                  { label: 'Custom', value: 'custom' },
                ]}
              />
              {snoozePreset === 'custom' && (
                <TextInput
                  label="Snooze until"
                  type="date"
                  value={customSnoozeDate}
                  onChange={(event) => setCustomSnoozeDate(event.currentTarget.value)}
                />
              )}
            </Stack>
          )}
        </Stack>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isPending} onClick={handleSave}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
