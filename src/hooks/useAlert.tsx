import { Text, Title } from '@mantine/core';
import { NotificationData, notifications } from '@mantine/notifications';
import { Check, X } from 'lucide-react';
import classes from './useAlert.module.css';

export const useAlert = () => {
  const successProps = {
    color: 'green',
    icon: <Check />,
    loading: false,
    autoClose: 2000,
  };

  const errorProps = {
    color: 'red',
    icon: <X />,
    loading: false,
    autoClose: 3000,
  };

  const loadingProps = {
    color: 'blue',
    loading: true,
    loaderProps: { type: 'dots' },
    autoClose: false,
    withCloseButton: false,
  };

  const showMessage = ({
    title,
    message,
    ...props
  }: { title: string; message: string } & Omit<
    NotificationData,
    'title' | 'message' | 'classNames'
  >) =>
    notifications.show({
      ...props,
      title: <Title order={3}>{title}</Title>,
      message: <Text>{message}</Text>,
      classNames: classes,
    });
  return {
    showSuccess: (title: string, message: string) =>
      showMessage({
        title,
        message,
        ...successProps,
      }),
    showError: (title: string, message: string) =>
      showMessage({
        title,
        message,
        ...errorProps,
      }),
    showLoading: (title: string, message: string) =>
      showMessage({
        title,
        message,
        ...loadingProps,
      }),
    doneLoadingSuccess: (title: string, message: string, notificationId: string) =>
      notifications.update({ id: notificationId, title, message, ...successProps }),
    doneLoadingError: (title: string, message: string, notificationId: string) =>
      notifications.update({ id: notificationId, title, message, ...errorProps }),
  };
};
