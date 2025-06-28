'use client';

import { Switch, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';
import { useCallback } from 'react';

export function ThemeToggle() {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });

  const toggleTheme = useCallback(() => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  }, [computedColorScheme, setColorScheme]);

  return (
    <Switch
      size="md"
      color="dark.4"
      checked={computedColorScheme === 'light'}
      onChange={() => toggleTheme()}
      onLabel={<Sun size={16} color="var(--mantine-color-yellow-4)" />}
      offLabel={<Moon size={16} color="var(--mantine-color-blue-6)" />}
    />
  );
}
