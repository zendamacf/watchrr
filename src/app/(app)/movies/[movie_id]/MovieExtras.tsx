import { Anchor, Group, Image, Skeleton, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import type { RecommendationDetails } from '@/lib/recommendations/types';
import { getImageUrl } from '@/lib/themoviedb/images';

/** A titled block of the page. */
export const DetailSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Stack component="section" gap="sm" aria-label={title}>
    <Title order={3} size="h4">
      {title}
    </Title>
    {children}
  </Stack>
);

/** Subscription services streaming the movie in the viewer's region. Renders nothing when there are none. */
export const WhereToWatch = ({ details }: { details: RecommendationDetails }) => {
  if (details.providers.length === 0) return null;

  return (
    <DetailSection title="Where to watch">
      <Group gap="md">
        {details.providers.map((p) => (
          <Group key={p.name} gap={8} wrap="nowrap">
            {p.logo && <Image src={getImageUrl(p.logo)} alt="" w={32} h={32} radius="sm" />}
            <Text size="sm">{p.name}</Text>
          </Group>
        ))}
      </Group>
      {/* TMDB's terms require crediting JustWatch for availability data. */}
      <Text size="xs" c="dimmed">
        Availability from{' '}
        {details.providers_link ? (
          <Anchor href={details.providers_link} target="_blank" rel="noopener noreferrer" inherit>
            JustWatch
          </Anchor>
        ) : (
          'JustWatch'
        )}
      </Text>
    </DetailSection>
  );
};

/** The top-billed cast with their characters, in a row that scrolls sideways. */
export const Cast = ({ details }: { details: RecommendationDetails }) => {
  if (details.cast.length === 0) return null;

  return (
    <DetailSection title="Cast">
      <Group component="ul" gap="xl" wrap="nowrap" p={0} m={0} pb="xs" style={{ listStyle: 'none', overflowX: 'auto' }}>
        {details.cast.map((member) => (
          <Stack component="li" key={`${member.name}-${member.character}`} gap={2} flex="0 0 auto" maw={160}>
            <Text fw={600} size="sm">
              {member.name}
            </Text>
            {member.character && (
              <Text size="sm" c="dimmed">
                {member.character}
              </Text>
            )}
          </Stack>
        ))}
      </Group>
    </DetailSection>
  );
};

export const ExtrasSkeleton = () => (
  <Stack gap="xs" role="status" aria-label="Loading details">
    <Skeleton height={20} width="30%" />
    <Skeleton height={20} width="60%" />
  </Stack>
);
