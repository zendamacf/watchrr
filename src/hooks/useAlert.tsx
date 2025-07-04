import { Text, Title } from '@mantine/core';
import { NotificationData, notifications } from '@mantine/notifications';
import { Check, X } from 'lucide-react';
import classes from './useAlert.module.css';

export const useAlert = () => {
  const showMessage = ({
    title,
    message,
    ...props
  }: { title: string; message: string } & Omit<
    NotificationData,
    'title' | 'message' | 'classNames'
  >) => {
    notifications.show({
      ...props,
      title: <Title order={3}>{title}</Title>,
      message: <Text>{message}</Text>,
      classNames: classes,
    });
  };
  return {
    showSuccess: (title: string, message: string) => {
      showMessage({
        title,
        message,
        color: 'var(--primary)',
        icon: <Check />,
      });
    },
    showError: (title: string, message: string) => {
      showMessage({
        title,
        message,
        color: 'var(--error)',
        icon: <X />,
        autoClose: 3000,
      });
    },
  };
};
