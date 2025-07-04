'use client';

import { Group } from '@mantine/core';
import { useState } from 'react';
import { Show } from './@types';
import { ShowCard } from './ShowCard';

type Props = { shows: Show[] };

export const ShowList = (props: Props) => {
  const [shows, setShows] = useState<Show[]>(props.shows);

  const removeShow = (tvshow_id: number) => setShows(shows.filter((t) => t.id !== tvshow_id));

  return (
    <Group wrap={'wrap'} gap={'md'}>
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </Group>
  );
};
