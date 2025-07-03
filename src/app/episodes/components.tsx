'use client';

import { FormattedDate } from '@/components/Dates';
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Card,
  Flex,
  Text,
  Title,
} from '@mantine/core';
import classNames from 'classnames';
import { ClockFading } from 'lucide-react';
import { ISOEpisode } from './@types';
import classes from './components.module.css';

export function PastEpisodes({ episodes }: { episodes: ISOEpisode[] }) {
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
        <AccordionControl icon={<ClockFading />}>Past Episodes</AccordionControl>
        <AccordionPanel>
          <GroupedEpisodes episodes={episodes} showDates />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export function GroupedEpisodes({
  episodes,
  showDates,
}: {
  episodes: ISOEpisode[];
  showDates?: boolean;
}) {
  return (
    <Flex wrap={'wrap'} gap={'md'}>
      {episodes.map((r) => (
        <EpisodeCard key={r.episodes.id} episode={r} showDate={showDates} />
      ))}
    </Flex>
  );
}

function EpisodeCard({ episode, showDate }: { episode: ISOEpisode; showDate?: boolean }) {
  return (
    <Card key={episode.episodes.id} w={400} withBorder>
      <Title order={3} lineClamp={1}>
        {episode.tvshows.name}
      </Title>
      <Text
        fw={'bold'}
      >{`S${String(episode.episodes.season).padStart(2, '0')}E${String(episode.episodes.episode).padStart(2, '0')}`}</Text>
      <Text>{episode.episodes.name}</Text>
      {showDate && (
        <Text className={classNames({ [classes.pastdate!]: episode.episodes.in_past })}>
          <FormattedDate iso={episode.episodes.local_date} />
        </Text>
      )}
    </Card>
  );
}
