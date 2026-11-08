'use client';

import { MediaGrid } from '@/components/MediaGrid';
import type { SubscribedShow } from '@/types';
import { ShowCard } from './ShowCard';

type Props = { shows: SubscribedShow[] };

export const ShowList = ({ shows }: Props) => {
  return (
    <MediaGrid>
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </MediaGrid>
  );
};
