'use client';

import { SimpleGrid } from '@mantine/core';
import type { Show } from '@/types';
import { ShowCard } from './ShowCard';

type Props = { shows: Show[] };

export const ShowList = ({ shows }: Props) => {
  return (
    <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
      {shows.map((show) => (
        <ShowCard key={show.uuid} show={show} />
      ))}
    </SimpleGrid>
  );
};
