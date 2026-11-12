'use client';

import { Alert, Anchor, Badge, Button, Group, Image, Modal, Skeleton, Stack, Text } from '@mantine/core';
import { CheckCheck, EyeOff, Play, Plus, Star } from 'lucide-react';
import { useRecommendationDetails } from '@/hooks/useRecommendationDetails';
import type { DismissalReason, Recommendation, RecommendationDetails } from '@/lib/recommendations/types';
import { getImageUrl } from '@/lib/themoviedb/images';

type Props = {
  /** The recommendation to describe. The modal is open while this is set. */
  recommendation: Recommendation | null;
  onClose: () => void;
  onAdd: (recommendation: Recommendation) => void;
  onHide: (recommendation: Recommendation, reason: DismissalReason) => void;
};

const formatRuntime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ''}` : `${rest}m`;
};

/** Facts for the line under the title: runtime or seasons, status. */
const facts = ({ runtime, seasons, status }: RecommendationDetails) =>
  [
    runtime ? formatRuntime(runtime) : null,
    seasons ? `${seasons} ${seasons === 1 ? 'season' : 'seasons'}` : null,
    status,
  ]
    .filter(Boolean)
    .join(' · ');

const Details = ({ details }: { details: RecommendationDetails }) => (
  <>
    {details.tagline && (
      <Text fs="italic" c="dimmed">
        {details.tagline}
      </Text>
    )}
    <Group gap="xs">
      {details.rating !== null && (
        <Badge variant="light" color="yellow" leftSection={<Star size={12} aria-hidden />}>
          {details.rating.toFixed(1)}
          <Text span inherit c="dimmed">
            {' '}
            ({details.votes.toLocaleString()})
          </Text>
        </Badge>
      )}
      {details.genres.map((genre) => (
        <Badge key={genre} variant="default">
          {genre}
        </Badge>
      ))}
    </Group>
  </>
);

const Extras = ({ details }: { details: RecommendationDetails }) => (
  <>
    {details.cast.length > 0 && (
      <Text size="sm">
        <Text span fw={600}>
          Starring{' '}
        </Text>
        {details.cast.map((c) => c.name).join(', ')}
      </Text>
    )}
    {details.providers.length > 0 && (
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Streaming on
        </Text>
        <Group gap="xs">
          {details.providers.map((p) => (
            <Group key={p.name} gap={6} wrap="nowrap">
              {p.logo && <Image src={getImageUrl(p.logo)} alt="" w={24} h={24} radius="sm" />}
              <Text size="sm">{p.name}</Text>
            </Group>
          ))}
        </Group>
        {/* TMDB's terms require crediting JustWatch for availability data. */}
        <Text size="xs" c="dimmed">
          Availability from{' '}
          {details.providers_link ? (
            <Anchor href={details.providers_link} target="_blank" rel="noopener noreferrer" inherit>
              JustWatch
            </Anchor>
          ) : (
            'JustWatch'
          )}
        </Text>
      </Stack>
    )}
    {details.trailer && (
      <Group>
        <Button
          component="a"
          variant="default"
          href={`https://www.youtube.com/watch?v=${encodeURIComponent(details.trailer)}`}
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<Play size={16} aria-hidden />}
        >
          Watch trailer
        </Button>
      </Group>
    )}
  </>
);

/** Full synopsis plus TMDB details (rating, genres, cast, trailer, streaming) for one recommendation. */
export const RecommendationDetailsModal = ({ recommendation, onClose, onAdd, onHide }: Props) => {
  const query = useRecommendationDetails(recommendation);
  const details = query.data;

  return (
    <Modal
      opened={recommendation !== null}
      onClose={onClose}
      title={recommendation?.name}
      size="lg"
      aria-label={recommendation ? `Details for ${recommendation.name}` : undefined}
    >
      {recommendation && (
        <Stack gap="sm">
          {details && facts(details) && (
            <Text size="sm" c="dimmed">
              {facts(details)}
            </Text>
          )}
          {query.isLoading && (
            <Stack gap="xs" aria-label="Loading details" role="status">
              <Skeleton height={20} width="40%" />
              <Skeleton height={20} width="60%" />
            </Stack>
          )}
          {details && <Details details={details} />}
          <Text>{recommendation.description || 'No synopsis available.'}</Text>
          {details && <Extras details={details} />}
          {query.isError && <Alert color="red">Could not load more details: {query.error.message}</Alert>}
          <Group justify="end" gap="xs">
            <Button
              variant="default"
              leftSection={<EyeOff size={16} aria-hidden />}
              onClick={() => {
                onHide(recommendation, 'not_interested');
                onClose();
              }}
            >
              Not interested
            </Button>
            <Button
              variant="default"
              leftSection={<CheckCheck size={16} aria-hidden />}
              onClick={() => {
                onHide(recommendation, 'already_watched');
                onClose();
              }}
            >
              Already watched
            </Button>
            <Button
              leftSection={<Plus size={16} aria-hidden />}
              onClick={() => {
                onAdd(recommendation);
                onClose();
              }}
            >
              Add
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
