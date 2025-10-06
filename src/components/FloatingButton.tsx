import { ActionIcon, ActionIconProps, Affix } from '@mantine/core';
import { Plus } from 'lucide-react';
import classes from './FloatingButton.module.css';

type Props = { onClick: () => void } & Omit<ActionIconProps, 'radius' | 'size'>;

export const FloatingButton = (props: Props) => {
  return (
    <Affix position={{ bottom: 30, right: 30 }}>
      <ActionIcon radius="xl" size={60} {...props} classNames={classes}>
        <Plus size={30} />
      </ActionIcon>
    </Affix>
  );
};
