import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import classes from './PublicPage.module.css';

export function PublicPage({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container size={420} my={40}>
      <Stack gap="calc(var(--mantine-spacing-xl) * 2)">
        <Logo />
        <Title ta="center" className={classes.title}>
          {title}
        </Title>
      </Stack>

      <Text className={classes.subtitle}>{subtitle}</Text>

      <Paper withBorder shadow="sm" p="lg" mt="xl">
        {children}
      </Paper>
    </Container>
  );
}
