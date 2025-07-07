import { getImageUrl } from '@/lib/themoviedb/images';
import { Card, CardProps } from '@mantine/core';
import classes from './BackdropCard.module.css';

type Props = {
  backdrop: string | null;
} & CardProps;

export const BackdropCard = ({ backdrop, children, ...props }: Props) => (
  <Card
    {...props}
    classNames={classes}
    withBorder
    style={{
      ...props.style,
      '--image-url': backdrop ? `url(${getImageUrl(backdrop)})` : undefined,
    }}
  >
    {children}
  </Card>
);
