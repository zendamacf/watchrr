'use client';

import { ActionIcon, Group, Text, Title } from '@mantine/core';
import { CheckCheck, EyeOff, Info, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { Fragment } from 'react';
import { MediaCard } from '@/components/MediaCard';
import type { DismissalReason, Recommendation } from '@/lib/recommendations/types';

type Props = {
  recommendation: Recommendation;
  onAdd: (recommendation: Recommendation) => void;
  onHide: (recommendation: Recommendation, reason: DismissalReason) => void;
  /** Opens the details modal. */
  onInfo: (recommendation: Recommendation) => void;
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

/**
 * Cards are dark in both color schemes (a scrim over the artwork), so one light teal serves both.
 * About 10:1 on the dark fallback and the scrim's lower half; lower at the top over a very bright backdrop.
 */
const REASON_COLOR = 'var(--mantine-color-afterglow-3)';

/** "A, B and C": the names emphasised, with the leftover count as plain dimmed text. */
const Reasons = ({ because, more }: { because: string[]; more: number }) => {
  // Two followed items can share a title; naming it twice would read oddly.
  const names = [...new Set(because)];
  const total = names.length + (more > 0 ? 1 : 0);
  const separator = (i: number) => (i === 0 ? '' : i === total - 1 ? ' and ' : ', ');

  return (
    <>
      {names.map((name, i) => (
        <Fragment key={name}>
          {separator(i)}
          {/* Bold and tinted rather than a background, which was hard to read on the artwork. */}
          <Text component="strong" inherit fw={600} c={REASON_COLOR}>
            {name}
          </Text>
        </Fragment>
      ))}
      {more > 0 && (
        <>
          {separator(names.length)}
          <Text span c="dimmed" inherit>
            {more} more
          </Text>
        </>
      )}
    </>
  );
};

export const RecommendationCard = ({ recommendation, onAdd, onHide, onInfo, busy }: Props) => (
  <MediaCard
    h={250}
    backdrop={recommendation.backdrop_slug}
    poster={recommendation.poster_slug}
    posterAlt={`Poster for ${recommendation.name}`}
    footer={
      <Group justify="end" gap="xs">
        <ActionIcon
          variant="white"
          color="gray"
          aria-label={`More about ${recommendation.name}`}
          onClick={() => onInfo(recommendation)}
        >
          <Info size={20} />
        </ActionIcon>
        <ActionIcon
          variant="white"
          color="gray"
          aria-label={`Not interested in ${recommendation.name}`}
          disabled={busy}
          onClick={() => onHide(recommendation, 'not_interested')}
        >
          <EyeOff size={20} />
        </ActionIcon>
        <ActionIcon
          variant="white"
          color="gray"
          aria-label={`Already watched ${recommendation.name}`}
          disabled={busy}
          onClick={() => onHide(recommendation, 'already_watched')}
        >
          <CheckCheck size={20} />
        </ActionIcon>
        <ActionIcon aria-label={`Add ${recommendation.name}`} loading={busy} onClick={() => onAdd(recommendation)}>
          <Plus size={20} />
        </ActionIcon>
      </Group>
    }
  >
    <Title order={3}>{recommendation.name}</Title>
    <Text size="sm">{detail(recommendation)}</Text>
    <Text size="sm" c="dimmed" lineClamp={3}>
      Because you watch <Reasons because={recommendation.because} more={recommendation.because_more} />
    </Text>
  </MediaCard>
);
