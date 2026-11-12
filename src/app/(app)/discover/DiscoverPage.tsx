'use client';

import { Alert, Group, Select, Space } from '@mantine/core';
import { Compass } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { InfiniteScrollSentinel } from '@/components/InfiniteScroll';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaGridSkeleton } from '@/components/MediaGridSkeleton';
import { useAddMovie, useAddShow } from '@/hooks/useAddMedia';
import {
  recommendationId,
  useNotInterested,
  useRecommendationsQuery,
  useRemoveRecommendation,
} from '@/hooks/useRecommendations';
import type { Recommendation, RecommendationType } from '@/lib/recommendations/types';
import { RecommendationCard } from './RecommendationCard';

type TypeFilter = 'all' | RecommendationType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Movies and shows' },
  { value: 'movie', label: 'Movies' },
  { value: 'tvshow', label: 'Shows' },
];

const EMPTY_COPY: Record<TypeFilter, { title: string; description: string }> = {
  all: {
    title: 'Nothing to recommend yet',
    description: 'Follow a few shows or movies and suggestions based on them will show up here.',
  },
  movie: { title: 'No movie suggestions', description: 'Follow more movies, or try another filter.' },
  tvshow: { title: 'No show suggestions', description: 'Follow more shows, or try another filter.' },
};

export const DiscoverPage = () => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const { recommendations, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useRecommendationsQuery({ type: typeFilter === 'all' ? undefined : typeFilter });

  const remove = useRemoveRecommendation();
  const addMovie = useAddMovie({ onAdded: (item) => remove({ type: 'movie', moviedb_id: item.moviedb_id }) });
  const addShow = useAddShow({ onAdded: (item) => remove({ type: 'tvshow', moviedb_id: item.moviedb_id }) });
  const hide = useNotInterested();

  const add = (item: Recommendation) =>
    (item.type === 'movie' ? addMovie : addShow).mutate({ moviedb_id: item.moviedb_id, name: item.name });
  const isBusy = (item: Recommendation) => {
    const adding = item.type === 'movie' ? addMovie : addShow;
    return adding.isPending && adding.variables?.moviedb_id === item.moviedb_id;
  };

  return (
    <>
      <Group align="flex-end" wrap="wrap" gap="md">
        <Select
          label="Show"
          aria-label="Filter recommendations by type"
          data={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(value) => setTypeFilter((value as TypeFilter | null) ?? 'all')}
          allowDeselect={false}
          w={{ base: '100%', sm: 220 }}
        />
      </Group>
      <Space h="md" />
      {isLoading ? (
        <MediaGridSkeleton />
      ) : isError ? (
        <Alert color="red">An error occurred</Alert>
      ) : (
        <>
          {recommendations.length ? (
            <MediaGrid>
              {recommendations.map((item) => (
                <RecommendationCard
                  key={recommendationId(item)}
                  recommendation={item}
                  busy={isBusy(item)}
                  onAdd={add}
                  onHide={(target) => hide.mutate(target)}
                />
              ))}
            </MediaGrid>
          ) : (
            <EmptyState icon={<Compass size={40} aria-hidden />} {...EMPTY_COPY[typeFilter]} />
          )}
          <InfiniteScrollSentinel
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            loadedCount={recommendations.length}
          />
        </>
      )}
    </>
  );
};
