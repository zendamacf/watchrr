'use client';

import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useId } from 'react';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaGridSkeleton } from '@/components/MediaGridSkeleton';
import { recommendationId } from '@/hooks/useRecommendations';
import type { Recommendation } from '@/lib/recommendations/types';
import { RecommendationCard } from './RecommendationCard';

type Props = {
  title: string;
  recommendations: Recommendation[];
  /** Matches across all pages, so the heading can say how many are behind "Show more". */
  total: number;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onAdd: (recommendation: Recommendation) => void;
  onHide: (recommendation: Recommendation) => void;
  onInfo: (recommendation: Recommendation) => void;
  isBusy: (recommendation: Recommendation) => boolean;
};

/** One shelf of recommendations. An empty shelf renders nothing, so the page only shows what it can suggest. */
export const DiscoverSection = ({
  title,
  recommendations,
  total,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onAdd,
  onHide,
  onInfo,
  isBusy,
}: Props) => {
  const headingId = useId();

  if (!isLoading && !isError && !recommendations.length) return null;

  return (
    <Stack component="section" aria-labelledby={headingId} gap="sm">
      <Group align="baseline" gap="xs">
        <Title order={2} id={headingId}>
          {title}
        </Title>
        {!isLoading && !isError && (
          <Text c="dimmed" size="sm">
            {total}
          </Text>
        )}
      </Group>
      {isLoading ? (
        <MediaGridSkeleton />
      ) : isError ? (
        <Alert color="red">Could not load {title.toLowerCase()}</Alert>
      ) : (
        <>
          <MediaGrid>
            {recommendations.map((item) => (
              <RecommendationCard
                key={recommendationId(item)}
                recommendation={item}
                busy={isBusy(item)}
                onAdd={onAdd}
                onHide={onHide}
                onInfo={onInfo}
              />
            ))}
          </MediaGrid>
          {hasNextPage && (
            <Group justify="center">
              <Button variant="default" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Show more {title.toLowerCase()}
              </Button>
            </Group>
          )}
        </>
      )}
    </Stack>
  );
};
