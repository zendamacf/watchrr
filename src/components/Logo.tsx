'use client';

import { Image, ImageProps, Skeleton, useMantineColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { useMemo } from 'react';

export function Logo(props: Pick<ImageProps, 'w' | 'h'>) {
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();
  const isDark = colorScheme === 'dark';

  const src = useMemo(() => (isDark ? '/watchrr-light.png' : '/watchrr-dark.png'), [isDark]);

  if (!mounted) return <Skeleton {...props} />;

  return <Image src={src} alt={'watchrr logo'} {...props} />;
}
