'use client';

import { getImageUrl } from '@/lib/themoviedb/images';
import { Card, Group, Title } from '@mantine/core';
import { Show } from './@types';
import classes from './ShowCard.module.css';

export const ShowCard = ({ show }: { show: Show }) => {
  return (
    <Card
      w={400}
      withBorder
      classNames={classes}
      style={
        show.backdrop_slug
          ? { '--image-url': `url(${getImageUrl(show.backdrop_slug)})` }
          : undefined
      }
    >
      <Group>
        <Title order={3}>{show.name}</Title>
      </Group>
    </Card>
  );
};
