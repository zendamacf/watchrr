import { Badge, Group, Image, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { Star } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { getImageUrl } from '@/lib/themoviedb/images';
import classes from './TitleHero.module.css';

type Props = {
  name: string;
  poster: string | null;
  backdrop: string | null;
  tagline?: string | null;
  /** The line of facts under the title, such as release date and runtime. */
  meta: ReactNode;
  /** Badges and other detail under the facts. */
  children?: ReactNode;
  /** Buttons, shown at the bottom right on wide screens and below the title on narrow ones. */
  actions?: ReactNode;
};

/** TMDB's 0-10 score as a badge. Renders nothing when nobody has voted. */
export const RatingBadge = ({ rating }: { rating: number | null | undefined }) =>
  rating == null ? null : (
    <Badge variant="light" color="yellow" leftSection={<Star size={12} aria-hidden />}>
      <VisuallyHidden>TMDB rating </VisuallyHidden>
      {rating.toFixed(1)}
      <VisuallyHidden> out of 10</VisuallyHidden>
    </Badge>
  );

/** The top of a movie or show page: a full-width backdrop with the poster and title over it. */
export const TitleHero = ({ name, poster, backdrop, tagline, meta, children, actions }: Props) => (
  <header
    className={classes.root}
    style={{ '--image-url': backdrop ? `url(${getImageUrl(backdrop, 'w1280')})` : undefined } as CSSProperties}
  >
    <div className={classes.inner}>
      <Group align="flex-end" wrap="nowrap" gap="lg" flex={1} miw={0}>
        <Image
          className={classes.poster}
          src={poster ? getImageUrl(poster) : undefined}
          fallbackSrc="/placeholder.jpg"
          alt={`Poster for ${name}`}
          w={{ base: 96, xs: 120, sm: 190 }}
          radius="md"
        />
        <Stack gap="sm" flex={1} miw={0}>
          <Stack gap={4}>
            <Title order={2} className={classes.title}>
              {name}
            </Title>
            {tagline && (
              <Text fs="italic" c="dimmed">
                {tagline}
              </Text>
            )}
          </Stack>
          <Group gap="md" align="center">
            {meta}
          </Group>
          {children}
        </Stack>
      </Group>
      {actions && (
        <Group gap="xs" className={classes.actions}>
          {actions}
        </Group>
      )}
    </div>
  </header>
);
