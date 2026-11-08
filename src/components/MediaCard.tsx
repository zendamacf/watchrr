'use client';

import { type CardProps, Group, Image, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import { getImageUrl } from '@/lib/themoviedb/images';
import { BackdropCard } from './BackdropCard';

type Props = {
  backdrop: string | null;
  poster: string | null;
  posterAlt: string;
  /** Pinned to the bottom of the text column (badges, actions). */
  footer?: ReactNode;
  children: ReactNode;
} & CardProps;

/** Poster on the left, details on the right, over a backdrop. Used by show and movie cards. */
export const MediaCard = ({ backdrop, poster, posterAlt, footer, children, ...props }: Props) => (
  <BackdropCard {...props} style={{ width: '100%' }} backdrop={backdrop}>
    <Group h={'100%'} align={'center'} wrap="nowrap">
      <Image
        src={poster ? getImageUrl(poster) : undefined}
        fallbackSrc={'/placeholder.jpg'}
        alt={posterAlt}
        radius="md"
        h={'100%'}
        w={'auto'}
        style={{ aspectRatio: '2 / 3', objectFit: 'cover', flex: '0 0 auto' }}
      />
      <Stack h={'100%'} justify={'space-between'} gap={'sm'} style={{ flex: 1, minWidth: 0 }}>
        <Stack gap={'xs'}>{children}</Stack>
        {footer}
      </Stack>
    </Group>
  </BackdropCard>
);
