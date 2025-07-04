'use client';

import { Card, CardSection, Group, Title } from '@mantine/core';
import { Show } from './@types';
import classes from './ShowCard.module.css';

export const ShowCard = ({ show }: { show: Show }) => {
  return (
    <Card
      w={400}
      withBorder
      classNames={classes}
      style={{ '--image-url': `url(${show.backdrop_url})` }}
    >
      <Group>
        <CardSection>
          {/* <Image
            w={400}
            h={500}
            src={show.poster}
            alt={`Poster for ${show.name}`}
            fallbackSrc={'/placeholder.jpg'}
          /> */}
        </CardSection>

        <Title order={3}>{show.name}</Title>
      </Group>
    </Card>
  );
};
