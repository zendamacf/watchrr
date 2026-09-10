'use client';

import { Accordion, AccordionControl, AccordionItem, AccordionPanel } from '@mantine/core';
import { Moon } from 'lucide-react';
import { GroupedEpisodes, type GroupedEpisodesProps } from './GroupedEpisodes';
import classes from './SnoozedEpisodes.module.css';

type Props = Omit<GroupedEpisodesProps, 'showDates' | 'variant'>;

export const SnoozedEpisodes = (props: Props) => {
  return (
    <Accordion
      id="snoozed-episodes"
      classNames={{
        item: classes['snoozed-episodes-accordion-item'],
        control: classes['snoozed-episodes-accordion-control'],
        content: classes['snoozed-episodes-accordion-panel'],
      }}
      transitionDuration={500}
    >
      <AccordionItem value="snoozed-episodes">
        <AccordionControl icon={<Moon />}>
          {props.episodes.length} Snoozed Episode{props.episodes.length === 1 ? '' : 's'}
        </AccordionControl>
        <AccordionPanel>
          <GroupedEpisodes {...props} variant="snoozed" showDates />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};
