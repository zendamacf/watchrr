'use client';

import { Group, Switch, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { Moon } from 'lucide-react';
import type { CSSProperties } from 'react';

/** "Dark mode" settings row: a fixed label with a switch showing whether it's on. */
export function ThemeMenuItem({ className, style }: { className?: string; style?: CSSProperties }) {
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const mounted = useMounted();
  const isDark = computedColorScheme === 'dark';

  if (!mounted) return null;

  return (
    <Group justify="space-between" className={className} style={style}>
      <Group gap="xs" component="span">
        <Moon size={18} aria-hidden />
        Dark mode
      </Group>
      <Switch
        aria-label="Dark mode"
        checked={isDark}
        onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
      />
    </Group>
  );
}
