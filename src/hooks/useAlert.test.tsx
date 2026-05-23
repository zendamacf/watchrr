import { MantineProvider } from '@mantine/core';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import theme from '@/app/theme';
import { useAlert } from './useAlert';

const { mockShow, mockUpdate } = vi.hoisted(() => ({
  mockShow: vi.fn(() => 'notification-id'),
  mockUpdate: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShow,
    update: mockUpdate,
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}

describe('useAlert', () => {
  beforeEach(() => {
    mockShow.mockClear();
    mockUpdate.mockClear();
    mockShow.mockReturnValue('notification-id');
  });

  it('showSuccess shows a green notification', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    result.current.showSuccess({ title: 'Done', message: 'Saved' });
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'green',
        loading: false,
        autoClose: 2000,
      }),
    );
  });

  it('showError shows a red notification', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    result.current.showError({ message: 'Failed' });
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        autoClose: 3000,
      }),
    );
  });

  it('showInfo shows a blue notification', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    result.current.showInfo({ message: 'Note' });
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'blue',
        loading: false,
      }),
    );
  });

  it('showLoading shows a loading notification and returns its id', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    const id = result.current.showLoading({ title: 'Wait', message: 'Loading…' });
    expect(id).toBe('notification-id');
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({
        loading: true,
        autoClose: false,
        withCloseButton: false,
      }),
    );
  });

  it('doneLoadingSuccess updates the notification', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    result.current.doneLoadingSuccess({ id: 'notification-id', title: 'Done', message: 'All set' });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'notification-id',
        color: 'green',
        loading: false,
      }),
    );
  });

  it('doneLoadingError updates the notification with error styling', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    result.current.doneLoadingError({ id: 'nid', message: 'Oops' });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'nid',
        color: 'red',
        loading: false,
      }),
    );
  });

  it('doneLoadingInfo updates the notification with info styling', () => {
    const { result } = renderHook(() => useAlert(), { wrapper });
    result.current.doneLoadingInfo({ id: 'nid', message: 'FYI' });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'nid',
        color: 'blue',
        loading: false,
      }),
    );
  });
});
