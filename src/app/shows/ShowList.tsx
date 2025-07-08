'use client';

import { SimpleGrid } from '@mantine/core';
import { Show } from './@types';
import { ShowCard } from './ShowCard';

type Props = { shows: Show[]; onRemove: () => void };

export const ShowList = ({ shows, onRemove }: Props) => {
  return (
    <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} onRemove={onRemove} />
      ))}
    </SimpleGrid>
  );
};
