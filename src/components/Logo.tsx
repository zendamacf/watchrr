'use client';

import { Image, type ImageProps, Skeleton, useComputedColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { useMemo } from 'react';

export function Logo(props: Pick<ImageProps, 'w' | 'h'>) {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const mounted = useMounted();
  const isDark = computedColorScheme === 'dark';

  const src = useMemo(() => (isDark ? '/watchrr-light.png' : '/watchrr-dark.png'), [isDark]);

  if (!mounted) return <Skeleton {...props} />;

  return <Image src={src} alt={'watchrr logo'} {...props} />;
}
