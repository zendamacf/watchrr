'use client';

import { Image, ImageProps, useComputedColorScheme } from '@mantine/core';
import { useMemo } from 'react';

export function Logo(props: Omit<ImageProps, 'src'>) {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const src = useMemo(
    () => (computedColorScheme === 'light' ? '/watchrr-dark.png' : '/watchrr-light.png'),
    [computedColorScheme],
  );
  console.log(computedColorScheme, src);
  return <Image src={src} alt={'watchrr logo'} {...props} />;
}
