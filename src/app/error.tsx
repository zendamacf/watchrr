'use client';

import { Button, Center, Group, Stack, Text, Title } from '@mantine/core';
import * as Sentry from '@sentry/nextjs';
import { TvMinimal } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { routes } from '@/lib/routes';
import classes from './error.module.css';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main>
      <Center className={classes.wrapper} px="md">
        <Stack align="center" gap="xs" ta="center">
          <TvMinimal size={48} aria-hidden color="var(--mantine-primary-color-filled)" />
          <Title order={2}>Something went wrong</Title>
          <Text c="dimmed" maw={380}>
            We couldn't load this page. Try again, or head back to your episodes.
          </Text>
          <Group mt="sm">
            <Button onClick={() => reset()}>Try again</Button>
            <Button component={Link} href={routes.home} variant="default">
              Back to episodes
            </Button>
          </Group>
        </Stack>
      </Center>
    </main>
  );
}
