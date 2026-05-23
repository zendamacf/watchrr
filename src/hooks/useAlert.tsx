import { Text, Title } from '@mantine/core';
import { type NotificationData, notifications } from '@mantine/notifications';
import { Check, Info, X } from 'lucide-react';
import type { ReactElement } from 'react';
import classes from './useAlert.module.css';

const successProps = {
  color: 'green',
  icon: <Check />,
  loading: false,
  autoClose: 2000,
};

const infoProps = {
  color: 'blue',
  icon: <Info />,
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

type MessageProps = {
  title?: string;
  message: string;
  icon?: ReactElement;
};

type UpdateMessageProps = { id: string } & MessageProps;

export const useAlert = () => {
  const showMessage = ({
    title,
    message,
    ...props
  }: MessageProps & Omit<NotificationData, 'title' | 'message' | 'classNames'>) =>
    notifications.show({
      ...props,
      title: title ? <Title order={3}>{title}</Title> : undefined,
      message: <Text>{message}</Text>,
      classNames: classes,
    });

  return {
    showSuccess: (props: MessageProps) => showMessage({ ...successProps, ...props }),
    showInfo: (props: MessageProps) => showMessage({ ...infoProps, ...props }),
    showError: (props: MessageProps) => showMessage({ ...errorProps, ...props }),
    showLoading: (props: MessageProps) => showMessage({ ...loadingProps, ...props }),

    doneLoadingSuccess: (props: UpdateMessageProps) => notifications.update({ ...successProps, ...props }),
    doneLoadingInfo: (props: UpdateMessageProps) => notifications.update({ ...infoProps, ...props }),
    doneLoadingError: (props: UpdateMessageProps) => notifications.update({ ...errorProps, ...props }),
  };
};
