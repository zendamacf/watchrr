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
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { BackdropCard } from '@/components/BackdropCard';
import { getImageUrl } from '@/lib/themoviedb/images';
import type { Show, ShowCard, ShowSubscription } from '@/types';
import { DateFormat } from '@/utils/dates';
import { isShowSnoozed } from '@/utils/episode-schedule';

type Props = {
  show: Show | ShowCard;
  subscription?: ShowSubscription;
  actions?: ReactNode;
} & CardProps;

export const BaseShowCard = ({ show, subscription, actions, ...props }: Props) => {
  const delayDays = subscription?.delay_days ?? 0;
  const snoozed = isShowSnoozed(subscription?.snoozed_until);

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
            <Group gap="xs">
              <Badge color={'blue'} variant={'outline'}>
                {show.country}
              </Badge>
              {delayDays > 0 && (
                <Badge color="blue" variant="outline">
                  {delayDays}d delay
                </Badge>
              )}
              {snoozed && subscription?.snoozed_until && (
                <Badge color="orange" variant="outline">
                  Snoozed until {DateTime.fromSQL(subscription.snoozed_until).toFormat(DateFormat.DMY)}
                </Badge>
              )}
            </Group>
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
