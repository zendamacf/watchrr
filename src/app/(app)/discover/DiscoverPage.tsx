'use client';

import { Stack } from '@mantine/core';
import { Compass } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { useAddMovie, useAddShow } from '@/hooks/useAddMedia';
import { useNotInterested, useRecommendationsQuery, useRemoveRecommendation } from '@/hooks/useRecommendations';
import type { DismissalReason, Recommendation } from '@/lib/recommendations/types';
import { DiscoverSection } from './DiscoverSection';
import { RecommendationDetailsModal } from './RecommendationDetailsModal';

/** Cards shown per shelf before "Show more": two rows on a wide screen. */
const SECTION_PAGE_SIZE = 6;

export const DiscoverPage = () => {
  const shows = useRecommendationsQuery({ type: 'tvshow', pageSize: SECTION_PAGE_SIZE });
  const movies = useRecommendationsQuery({ type: 'movie', pageSize: SECTION_PAGE_SIZE });

  const [selected, setSelected] = useState<Recommendation | null>(null);

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

  const settled = !shows.isLoading && !movies.isLoading;
  const nothingToShow = settled && !shows.isError && !movies.isError && !shows.total && !movies.total;

  if (nothingToShow) {
    return (
      <EmptyState
        icon={<Compass size={40} aria-hidden />}
        title="Nothing to recommend yet"
        description="Follow a few shows or movies and suggestions based on them will show up here."
      />
    );
  }

  const hideItem = (target: Recommendation, reason: DismissalReason) => hide.mutate({ ...target, reason });
  const shared = { onAdd: add, onHide: hideItem, onInfo: setSelected, isBusy };

  return (
    <Stack gap="xl">
      <DiscoverSection
        title="Shows"
        recommendations={shows.recommendations}
        total={shows.total}
        isLoading={shows.isLoading}
        isError={shows.isError}
        hasNextPage={shows.hasNextPage}
        isFetchingNextPage={shows.isFetchingNextPage}
        fetchNextPage={shows.fetchNextPage}
        {...shared}
      />
      <DiscoverSection
        title="Movies"
        recommendations={movies.recommendations}
        total={movies.total}
        isLoading={movies.isLoading}
        isError={movies.isError}
        hasNextPage={movies.hasNextPage}
        isFetchingNextPage={movies.isFetchingNextPage}
        fetchNextPage={movies.fetchNextPage}
        {...shared}
      />
      <RecommendationDetailsModal
        recommendation={selected}
        onClose={() => setSelected(null)}
        onAdd={add}
        onHide={hideItem}
      />
    </Stack>
  );
};
