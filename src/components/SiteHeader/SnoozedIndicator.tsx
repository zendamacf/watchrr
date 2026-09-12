'use client';

import { Indicator, Tooltip, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ClockFading } from 'lucide-react';
import { useSnoozedEpisodeCount } from '@/hooks/useEpisodes';
import classes from './SiteHeader.module.css';
import { SnoozedEpisodesModal } from './SnoozedEpisodesModal';

export const SnoozedIndicator = () => {
  const count = useSnoozedEpisodeCount();
  const [opened, { open, close }] = useDisclosure(false);
  const label = count === 1 ? '1 snoozed episode' : `${count} snoozed episodes`;

  if (count === 0) {
    return;
  }

  return (
    <>
      <Tooltip label={label}>
        <Indicator inline disabled={count === 0} label={count} size={16} color="orange">
          <UnstyledButton
            aria-label={label}
            aria-haspopup="dialog"
            className={classes['snoozed-indicator-button']}
            onClick={open}
          >
            <ClockFading size={20} strokeWidth={count > 0 ? 2.25 : 1.75} />
          </UnstyledButton>
        </Indicator>
      </Tooltip>
      <SnoozedEpisodesModal opened={opened} onClose={close} />
    </>
  );
};
