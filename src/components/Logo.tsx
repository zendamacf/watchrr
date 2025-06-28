import { Image, ImageProps, useComputedColorScheme } from '@mantine/core';

export function Logo(props: Omit<ImageProps, 'src'>) {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const src = computedColorScheme === 'light' ? '/watchrr-dark.png' : '/watchrr-light.png';
  return <Image src={src} alt={'watchrr logo'} {...props} />;
}
