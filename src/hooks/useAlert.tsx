import { notifications } from '@mantine/notifications';
import { Check, X } from 'lucide-react';
import classes from './useAlert.module.css';

export const useAlert = () => {
  return {
    showSuccess: (title: string, message: string) => {
      notifications.show({
        title,
        message,
        color: 'var(--primary)',
        icon: <Check />,
        classNames: classes,
      });
    },
    showError: (title: string, message: string) => {
      notifications.show({
        title,
        message,
        color: 'var(--error)',
        icon: <X />,
        classNames: classes,
      });
    },
  };
};
