import { Anchor, Group, Image, Stack, Text } from '@mantine/core';
import classNames from 'classnames';
import classes from './AppFooter.module.css';

export const GITHUB_URL = 'https://github.com/zendamacf/watchrr';
export const TMDB_URL = 'https://www.themoviedb.org';

export function AppFooter({ className }: { className?: string }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <footer className={classNames(classes.footer, className)}>
      <Stack gap="xs" align="center">
        <Group gap="xs" justify="center">
          <Anchor href={GITHUB_URL} target="_blank" rel="noopener noreferrer" size="xs" c="dimmed">
            GitHub
          </Anchor>
          {version && (
            <Text size="xs" c="dimmed">
              v{version}
            </Text>
          )}
        </Group>
        <Anchor href={TMDB_URL} target="_blank" rel="noopener noreferrer" aria-label="The Movie Database (TMDB)">
          <Image src="/tmdb-logo.svg" alt="TMDB" h={10} w="auto" />
        </Anchor>
        <Text size="xs" c="dimmed" ta="center" maw={320}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
      </Stack>
    </footer>
  );
}
