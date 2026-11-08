'use client';

import {
  Anchor,
  Badge,
  type CardProps,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { MediaCard } from '@/components/MediaCard';
import type { Show, ShowCard, ShowSubscription } from '@/types';
import { DateFormat } from '@/utils/dates';
import { DELAY_UI_COLOR, isShowSnoozed } from '@/utils/episode-schedule';
import { formatTvShowStatusLabel, tvShowStatusBadgeColor } from '@/utils/tvshowStatus';

type Props = {
  show: Show | ShowCard;
  subscription?: ShowSubscription;
  titleHref?: string;
  actions?: ReactNode;
} & CardProps;

export const BaseShowCard = ({ show, subscription, titleHref, actions, ...props }: Props) => {
  const delayDays = subscription?.delay_days ?? 0;
  const snoozed = isShowSnoozed(subscription?.snoozed_until);

  return (
    <MediaCard
      {...props}
      backdrop={show.backdrop_slug}
      poster={show.poster_slug}
      posterAlt={`Poster for ${show.name}`}
      footer={
        <Group justify={'space-between'} wrap="nowrap">
          <Group gap="xs">
            {show.status ? (
              <Badge color={tvShowStatusBadgeColor(show.status)} variant="filled" size="sm">
                {formatTvShowStatusLabel(show.status)}
              </Badge>
            ) : null}
            {delayDays > 0 && (
              <Popover width="unset">
                <PopoverTarget>
                  <Badge color={DELAY_UI_COLOR} variant="outline" size="sm" style={{ cursor: 'help' }}>
                    {delayDays}d
                  </Badge>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text size="sm">{delayDays} day delay</Text>
                </PopoverDropdown>
              </Popover>
            )}
            {snoozed && subscription?.snoozed_until && (
              <Popover width="unset">
                <PopoverTarget>
                  <Badge color="orange" variant="outline" size="sm" style={{ cursor: 'help' }}>
                    Snoozed
                  </Badge>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text size="sm">
                    Snoozed until {DateTime.fromSQL(subscription.snoozed_until).toFormat(DateFormat.DMY)}
                  </Text>
                </PopoverDropdown>
              </Popover>
            )}
          </Group>
          {actions && (
            <Group justify={'end'} gap={'xs'}>
              {actions}
            </Group>
          )}
        </Group>
      }
    >
      {titleHref ? (
        <Anchor href={titleHref} underline="never" c="inherit">
          <Stack gap={2}>
            <Title order={3}>{show.name}</Title>
            <Group gap={4} wrap="nowrap" c="var(--mantine-color-anchor)">
              <Text size="sm" fw={500} component="span">
                View show
              </Text>
              <ChevronRight size={16} aria-hidden />
            </Group>
          </Stack>
        </Anchor>
      ) : (
        <Title order={3}>{show.name}</Title>
      )}
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
    </MediaCard>
  );
};
