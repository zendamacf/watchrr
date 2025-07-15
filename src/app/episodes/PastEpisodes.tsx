'use client';

import { Accordion, AccordionControl, AccordionItem, AccordionPanel } from '@mantine/core';
import { ClockFading } from 'lucide-react';
import { GroupedEpisodes, GroupedEpisodesProps } from './GroupedEpisodes';
import classes from './PastEpisodes.module.css';

type Props = Omit<GroupedEpisodesProps, 'showDates'>;

export const PastEpisodes = (props: Props) => {
  return (
    <Accordion
      classNames={{
        item: classes['past-episodes-accordion-item'],
        control: classes['past-episodes-accordion-control'],
        content: classes['past-episodes-accordion-panel'],
      }}
      transitionDuration={500}
    >
      <AccordionItem value={'past-episodes'}>
        <AccordionControl icon={<ClockFading />}>
          {props.episodes.length} Past Episodes
        </AccordionControl>
        <AccordionPanel>
          <GroupedEpisodes {...props} showDates />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};
