'use client';

import { Indicator, Tooltip, UnstyledButton } from '@mantine/core';
import { Moon } from 'lucide-react';
import { useSnoozedEpisodeCount } from '@/hooks/useEpisodes';
import classes from './SiteHeader.module.css';

export const SnoozedIndicator = () => {
  const count = useSnoozedEpisodeCount();
  const label = count === 1 ? '1 snoozed episode' : `${count} snoozed episodes`;

  return (
    <Tooltip label={count > 0 ? label : 'No snoozed episodes'}>
      <Indicator inline disabled={count === 0} label={count} size={16} color="orange">
        <UnstyledButton aria-label={label} className={classes['snoozed-indicator-button']}>
          <Moon size={20} strokeWidth={count > 0 ? 2.25 : 1.75} />
        </UnstyledButton>
      </Indicator>
    </Tooltip>
  );
};
