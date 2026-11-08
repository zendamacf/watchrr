import { SimpleGrid, type SimpleGridProps } from '@mantine/core';

/** Responsive grid shared by the episode, show and movie lists. */
export const MediaGrid = (props: SimpleGridProps) => (
  <SimpleGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }} {...props} />
);
