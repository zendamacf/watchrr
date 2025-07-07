'use client';

import { SimpleGrid } from '@mantine/core';
import { useState } from 'react';
import { Show } from './@types';
import { ShowCard } from './ShowCard';

type Props = { shows: Show[] };

export const ShowList = (props: Props) => {
  const [shows, setShows] = useState<Show[]>(props.shows);

  const removeShow = (tvshow_id: number) => setShows(shows.filter((t) => t.id !== tvshow_id));

  return (
    <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} removeShow={removeShow} />
      ))}
    </SimpleGrid>
  );
};
