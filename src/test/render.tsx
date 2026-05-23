import { MantineProvider } from '@mantine/core';
import { type RenderOptions, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import theme from '@/app/theme';

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MantineProvider theme={theme}>{children}</MantineProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
