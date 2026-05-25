'use client';

import {
  Badge,
  type CardProps,
  Group,
  Image,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { BackdropCard } from '@/components/BackdropCard';
import { getImageUrl } from '@/lib/themoviedb/images';
import type { Show, ShowCard } from '@/types';

type Props = {
  show: Show | ShowCard;
  actions?: ReactNode;
} & CardProps;

export const BaseShowCard = ({ show, actions, ...props }: Props) => {
  return (
    <BackdropCard {...props} style={{ width: '100%' }} backdrop={show.backdrop_slug}>
      <Group h={'100%'} align={'center'}>
        <Image
          src={show.poster_slug ? getImageUrl(show.poster_slug) : undefined}
          fallbackSrc={'/placeholder.jpg'}
          alt={`Poster for ${show.name}`}
          flex={1}
          mah={'100%'}
          style={{ objectFit: 'contain' }}
        />
        <Stack h={'100%'} justify={'space-between'} flex={2}>
          <Stack gap={'xs'}>
            <Title order={3}>{show.name}</Title>
            <Popover width={'unset'}>
              <PopoverTarget>
                <Text c={'dimmed'} lineClamp={3}>
                  {show.description}
                </Text>
              </PopoverTarget>
              <PopoverDropdown>
                <Text>{show.description}</Text>
              </PopoverDropdown>
            </Popover>
          </Stack>
          <Group justify={'space-between'}>
            <Badge color={'blue'} variant={'outline'}>
              {show.country}
            </Badge>
            {actions && (
              <Group justify={'end'} gap={'xs'}>
                {actions}
              </Group>
            )}
          </Group>
        </Stack>
      </Group>
    </BackdropCard>
  );
};
