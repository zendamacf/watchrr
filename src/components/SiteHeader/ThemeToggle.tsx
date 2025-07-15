'use client';

import { Switch, useMantineColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { Moon, Sun } from 'lucide-react';
import { useCallback } from 'react';

export function ThemeToggle() {
  const { setColorScheme, colorScheme } = useMantineColorScheme({ keepTransitions: true });
  const mounted = useMounted();
  const isDark = colorScheme === 'dark';

  const toggleTheme = useCallback(() => {
    setColorScheme(isDark ? 'light' : 'dark');
  }, [isDark, setColorScheme]);

  if (!mounted) return <div style={{ width: 50 }}></div>;

  return (
    <Switch
      size="md"
      color="dark.4"
      checked={!isDark}
      onChange={() => toggleTheme()}
      onLabel={<Sun size={16} color="var(--mantine-color-yellow-4)" />}
      offLabel={<Moon size={16} color="var(--mantine-color-blue-6)" />}
      style={{ width: 50 }}
    />
  );
}
