'use client';

import { Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DateTime } from 'luxon';
import { useShowStatsQuery } from '@/hooks/useStats';
import { DateFormat } from '@/utils/dates';
import { formatDuration } from '@/utils/formatDuration';

const formatDate = (iso: string | null) => (iso ? DateTime.fromISO(iso).toFormat(DateFormat.DMY) : '—');

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={0}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </Stack>
  );
}

/** Progress and pace for one show. Renders nothing while loading or on error; the episode list is the page's focus. */
export const ShowStats = ({ tvshowId }: { tvshowId: string }) => {
  const { data } = useShowStatsQuery(tvshowId);
  if (!data) return null;

  return (
    <Stack gap="md">
      <Title order={3}>Stats</Title>
      <Paper withBorder p="md" radius="md">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
          <Fact label="Watched" value={`${data.watched} / ${data.aired} aired`} />
          <Fact label="Backlog" value={data.backlog === 0 ? 'Caught up' : `${data.backlog} episodes`} />
          <Fact
            label="Time to finish backlog"
            value={
              data.backlog === 0 ? '—' : data.backlogMinutes === null ? 'Unknown' : formatDuration(data.backlogMinutes)
            }
          />
          <Fact label="Started" value={formatDate(data.startedAt)} />
          <Fact label="Last watched" value={formatDate(data.lastWatchedAt)} />
          <Fact label="Pace" value={data.episodesPerWeek === null ? '—' : `${data.episodesPerWeek} episodes / week`} />
          <Fact label="Next episode airs" value={formatDate(data.nextAirDate)} />
        </SimpleGrid>
      </Paper>
      <Stack gap="xs">
        {data.seasons.map((season) => (
          <Stack key={season.season} gap={4}>
            <Group justify="space-between">
              <Text size="sm">Season {season.season}</Text>
              <Text size="sm" c="dimmed">
                {season.watched} / {season.aired} aired
              </Text>
            </Group>
            <Progress
              color="afterglow"
              value={season.aired === 0 ? 0 : (season.watched / season.aired) * 100}
              aria-label={`Season ${season.season} progress`}
            />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
