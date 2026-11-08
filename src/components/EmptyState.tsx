import { Button, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

/** An empty list says what is missing and what to do about it. */
export const EmptyState = ({ icon, title, description, action }: Props) => (
  <Stack align="center" gap="xs" py={60} ta="center" c="dimmed">
    {icon}
    <Title order={3} c="var(--mantine-color-text)">
      {title}
    </Title>
    <Text maw={380}>{description}</Text>
    {action && (
      <Button mt="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </Stack>
);
