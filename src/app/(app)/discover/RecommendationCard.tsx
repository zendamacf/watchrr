'use client';

import { ActionIcon, Group, Text, Title } from '@mantine/core';
import { EyeOff, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { MediaCard } from '@/components/MediaCard';
import type { Recommendation } from '@/lib/recommendations/types';

type Props = {
  recommendation: Recommendation;
  onAdd: (recommendation: Recommendation) => void;
  onHide: (recommendation: Recommendation) => void;
  /** Disables the actions while this card's request is in flight. */
  busy?: boolean;
};

const detail = ({ type, releasedate, country }: Recommendation) => {
  if (type === 'movie') {
    const year = releasedate ? DateTime.fromISO(releasedate).year : null;
    return year ? String(year) : 'Movie';
  }
  return country ? `Show · ${country}` : 'Show';
};

export const RecommendationCard = ({ recommendation, onAdd, onHide, busy }: Props) => (
  <MediaCard
    h={200}
    backdrop={recommendation.backdrop_slug}
    poster={recommendation.poster_slug}
    posterAlt={`Poster for ${recommendation.name}`}
    footer={
      <Group justify="end" gap="xs">
        <ActionIcon
          variant="white"
          color="gray"
          aria-label={`Not interested in ${recommendation.name}`}
          disabled={busy}
          onClick={() => onHide(recommendation)}
        >
          <EyeOff size={20} />
        </ActionIcon>
        <ActionIcon aria-label={`Add ${recommendation.name}`} loading={busy} onClick={() => onAdd(recommendation)}>
          <Plus size={20} />
        </ActionIcon>
      </Group>
    }
  >
    <Title order={3}>{recommendation.name}</Title>
    <Text size="sm">{detail(recommendation)}</Text>
    <Text size="sm" c="dimmed">
      Because you watch {recommendation.because}
    </Text>
  </MediaCard>
);
