'use client';

import { BarChart } from '@mantine/charts';
import { Alert, Badge, Center, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { BarChart3 } from 'lucide-react';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { useStatsQuery } from '@/hooks/useStats';
import type { OverallStats, WatchCounts } from '@/lib/stats/types';
import { formatDuration } from '@/utils/formatDuration';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function StatCard({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text fz={28} fw={700} lh={1.2}>
        {value}
      </Text>
      {children}
    </Paper>
  );
}

function WatchedCard({ label, counts }: { label: string; counts: WatchCounts }) {
  return (
    <StatCard label={label} value={counts.total}>
      <Text size="sm" c="dimmed">
        {counts.thisWeek} this week · {counts.thisMonth} this month · {counts.thisYear} this year
      </Text>
      {counts.unknownDate > 0 && (
        <Text size="xs" c="dimmed">
          {counts.unknownDate} with unknown date
        </Text>
      )}
    </StatCard>
  );
}

const isEmpty = (stats: OverallStats) =>
  stats.episodes.total === 0 &&
  stats.movies.total === 0 &&
  stats.shows.watching + stats.shows.caughtUp + stats.shows.snoozed + stats.shows.ended === 0;

export const StatsPage = () => {
  const { data, isLoading, isError } = useStatsQuery();

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (isError || !data) return <Alert color="red">An error occurred</Alert>;

  if (isEmpty(data)) {
    return (
      <EmptyState
        icon={<BarChart3 size={40} aria-hidden />}
        title="No stats yet"
        description="Follow a show or movie and mark things as watched to see your stats here."
      />
    );
  }

  const activity = data.activity.map((point) => ({
    week: DateTime.fromISO(point.weekStart).toFormat('d LLL'),
    Episodes: point.episodes,
    Movies: point.movies,
  }));
  const genres = data.genres.map((g) => ({ genre: g.name, Episodes: g.episodes, Movies: g.movies }));
  const weekdays = data.weekdays.map((point) => ({ day: WEEKDAY_LABELS[point.weekday - 1], Watched: point.count }));

  return (
    <Stack gap="xl">
      <Title order={2}>Stats</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <WatchedCard label="Episodes watched" counts={data.episodes} />
        <WatchedCard label="Movies watched" counts={data.movies} />
        <StatCard label="Estimated watch time" value={formatDuration(data.watchMinutes)}>
          {data.missingRuntimeCount > 0 && (
            <Text size="xs" c="dimmed">
              Excludes {data.missingRuntimeCount} {data.missingRuntimeCount === 1 ? 'item' : 'items'} without a runtime
              yet
            </Text>
          )}
        </StatCard>
        <StatCard label="Backlog" value={data.backlog}>
          <Text size="sm" c="dimmed">
            aired episodes not yet watched
          </Text>
        </StatCard>
        <StatCard
          label="Current streak"
          value={`${data.streaks.current} ${data.streaks.current === 1 ? 'day' : 'days'}`}
        >
          <Text size="sm" c="dimmed">
            Longest: {data.streaks.longest} {data.streaks.longest === 1 ? 'day' : 'days'}
          </Text>
        </StatCard>
        <StatCard
          label="Shows"
          value={data.shows.watching + data.shows.caughtUp + data.shows.snoozed + data.shows.ended}
        >
          <Group gap="xs" mt={4}>
            <Badge color="signal" variant="light">
              {data.shows.watching} watching
            </Badge>
            <Badge color="afterglow" variant="light">
              {data.shows.caughtUp} caught up
            </Badge>
            <Badge color="orange" variant="light">
              {data.shows.snoozed} snoozed
            </Badge>
            <Badge color="gray" variant="light">
              {data.shows.ended} ended
            </Badge>
          </Group>
        </StatCard>
      </SimpleGrid>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Activity by week
        </Title>
        <BarChart
          h={260}
          data={activity}
          dataKey="week"
          type="stacked"
          series={[
            { name: 'Episodes', color: 'signal.6' },
            { name: 'Movies', color: 'afterglow.6' },
          ]}
          withLegend
        />
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Most active days
        </Title>
        <BarChart h={220} data={weekdays} dataKey="day" series={[{ name: 'Watched', color: 'signal.6' }]} />
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Genres
        </Title>
        {genres.length === 0 ? (
          <Text size="sm" c="dimmed">
            Nothing watched yet.
          </Text>
        ) : (
          <BarChart
            h={Math.max(160, genres.length * 36)}
            data={genres}
            dataKey="genre"
            orientation="vertical"
            type="stacked"
            series={[
              { name: 'Episodes', color: 'signal.6' },
              { name: 'Movies', color: 'afterglow.6' },
            ]}
            withLegend
            yAxisProps={{ width: 100 }}
          />
        )}
      </Paper>

      <Text size="xs" c="dimmed">
        Charts cover {DateTime.fromISO(data.range.from).toFormat('d LLL yyyy')} to{' '}
        {DateTime.fromISO(data.range.to).toFormat('d LLL yyyy')} and only include items watched since watch times began
        being recorded.
      </Text>
    </Stack>
  );
};
