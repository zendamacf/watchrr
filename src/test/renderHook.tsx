import { MantineProvider } from '@mantine/core';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderHookOptions, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import theme from '@/app/theme';
import { createTestQueryClient } from '@/test/render';

export { createTestQueryClient };

export function createHookWrapper(queryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </QueryClientProvider>
    );
  };
}

export function renderHookWithProviders<TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & { queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return renderHook(callback, {
    ...options,
    wrapper: createHookWrapper(queryClient),
  });
}
