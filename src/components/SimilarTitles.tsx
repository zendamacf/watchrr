import { ActionIcon, Button, Group, Image, Stack, Text } from '@mantine/core';
import { Info, Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { RecommendationDetailsModal } from '@/app/(app)/discover/RecommendationDetailsModal';
import { useAddMovie, useAddShow } from '@/hooks/useAddMedia';
import { useNotInterested } from '@/hooks/useRecommendations';
import type {
  DismissalReason,
  Recommendation,
  RecommendationType,
  SimilarMovie,
  SimilarShow,
} from '@/lib/recommendations/types';
import { getImageUrl } from '@/lib/themoviedb/images';
import { DetailSection } from './TitleExtras';

type Props = {
  type: RecommendationType;
  titles: (SimilarMovie | SimilarShow)[];
  /** Called after a title was followed or hidden, so the page can reload its list. */
  onChanged: () => void;
};

/** The details modal is shared with Discover, which describes candidates as recommendations. */
const toRecommendation = (type: RecommendationType, title: SimilarMovie | SimilarShow): Recommendation => ({
  type,
  releasedate: null,
  country: null,
  ...title,
  backdrop_slug: null,
  score: 0,
  because: [],
  because_more: 0,
});

/** A movie's release year or a show's country: the one fact the cache holds. */
const subtitle = (title: SimilarMovie | SimilarShow) => {
  if ('releasedate' in title) return title.releasedate ? String(DateTime.fromISO(title.releasedate).year) : null;
  return title.country;
};

/** Titles TMDB suggests alongside this one. Each can be read about, followed or hidden. */
export const SimilarTitles = ({ type, titles, onChanged }: Props) => {
  const addMovie = useAddMovie({ onAdded: onChanged });
  const addShow = useAddShow({ onAdded: onChanged });
  const add = type === 'movie' ? addMovie : addShow;
  const hide = useNotInterested();
  const [selected, setSelected] = useState<Recommendation | null>(null);

  if (titles.length === 0) return null;

  const follow = (title: Pick<SimilarMovie, 'moviedb_id' | 'name'>) =>
    add.mutate({ moviedb_id: title.moviedb_id, name: title.name });
  const hideTitle = (target: Recommendation, reason: DismissalReason) =>
    hide.mutate({ ...target, reason }, { onSuccess: onChanged });

  return (
    <DetailSection title="More like this">
      <Group
        component="ul"
        gap="md"
        align="stretch"
        wrap="nowrap"
        p={0}
        m={0}
        pb="xs"
        style={{ listStyle: 'none', overflowX: 'auto' }}
      >
        {titles.map((title) => (
          <Stack component="li" key={title.moviedb_id} gap="xs" w={140} flex="0 0 auto">
            <Image
              src={title.poster_slug ? getImageUrl(title.poster_slug) : undefined}
              fallbackSrc="/placeholder.jpg"
              alt={`Poster for ${title.name}`}
              radius="md"
              style={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
            />
            <Stack gap={0}>
              <Text size="sm" fw={600} lineClamp={2} title={title.name}>
                {title.name}
              </Text>
              <Text size="xs" c="dimmed">
                {subtitle(title) ?? ' '}
              </Text>
            </Stack>
            {/* The buttons sit at the bottom of every card, however many lines the title wraps to. */}
            <Group gap={6} wrap="nowrap" mt="auto">
              <ActionIcon
                variant="default"
                size={26}
                aria-label={`More about ${title.name}`}
                onClick={() => setSelected(toRecommendation(type, title))}
              >
                <Info size={16} />
              </ActionIcon>
              <Button
                size="compact-sm"
                variant="default"
                flex={1}
                leftSection={<Plus size={14} aria-hidden />}
                aria-label={`Add ${title.name}`}
                loading={add.isPending && add.variables?.moviedb_id === title.moviedb_id}
                onClick={() => follow(title)}
              >
                Add
              </Button>
            </Group>
          </Stack>
        ))}
      </Group>

      <RecommendationDetailsModal
        recommendation={selected}
        onClose={() => setSelected(null)}
        onAdd={follow}
        onHide={hideTitle}
      />
    </DetailSection>
  );
};
