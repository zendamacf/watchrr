import { Card, Group, Skeleton, Stack } from '@mantine/core';
import { MediaGrid } from './MediaGrid';

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

/**
 * Placeholders mirror the real cards (same padding, height and inner layout) so the
 * list doesn't jump when data arrives. Keep in sync with MediaCard and EpisodeCard.
 */

/** Matches the show and movie cards: 250px tall, 2:3 poster beside title, description and actions. */
const PosterCardSkeleton = () => (
  <Card h={250} withBorder aria-hidden>
    <Group h="100%" align="center" wrap="nowrap">
      <Skeleton h="100%" w="auto" radius="md" style={{ aspectRatio: '2 / 3', flex: '0 0 auto' }} />
      <Stack h="100%" justify="space-between" gap="sm" style={{ flex: 1, minWidth: 0 }}>
        <Stack gap="xs">
          <Skeleton height={22} width="70%" />
          <Skeleton height={12} />
          <Skeleton height={12} />
          <Skeleton height={12} width="55%" />
        </Stack>
        <Group justify="space-between" wrap="nowrap">
          <Skeleton height={18} width={64} radius="xl" />
          <Group gap="xs" wrap="nowrap">
            <Skeleton height={28} width={28} />
            <Skeleton height={28} width={28} />
          </Group>
        </Group>
      </Stack>
    </Group>
  </Card>
);

/** Matches the episode card: title row, then episode number and name beside the action buttons. */
const EpisodeCardSkeleton = () => (
  <Card withBorder aria-hidden>
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Skeleton height={26} width="55%" />
    </Group>
    <Group justify="space-between" align="flex-end" wrap="nowrap">
      <Stack gap={0} style={{ flex: 1 }}>
        <Skeleton height={16} width={64} my={4.4} />
        <Skeleton height={16} width="60%" my={4.4} />
      </Stack>
      <Group gap="xs" wrap="nowrap">
        <Skeleton height={28} width={28} />
        <Skeleton height={28} width={28} />
      </Group>
    </Group>
  </Card>
);

/** Show and movie lists. */
export const MediaGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <MediaGrid data-testid="media-skeleton" aria-busy aria-label="Loading">
    {range(count).map((i) => (
      <PosterCardSkeleton key={i} />
    ))}
  </MediaGrid>
);

/** Episode list: a day header followed by a grid of episode cards. */
export const EpisodeGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <Stack gap="sm" data-testid="media-skeleton" aria-busy aria-label="Loading">
    <Skeleton height={31} width={240} />
    <MediaGrid>
      {range(count).map((i) => (
        <EpisodeCardSkeleton key={i} />
      ))}
    </MediaGrid>
  </Stack>
);
