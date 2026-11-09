import { Anchor, Group, Text } from '@mantine/core';
import classNames from 'classnames';
import classes from './AppFooter.module.css';

export const GITHUB_URL = 'https://github.com/zendamacf/watchrr';

export function AppFooter({ className }: { className?: string }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <footer className={classNames(classes.footer, className)}>
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
    </footer>
  );
}
