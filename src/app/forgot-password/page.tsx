import { PublicPage } from '@/components/Layout/PublicPage';
import { Anchor, Box, Button, Center, Group, TextInput } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import classes from './page.module.css';

export default async function ForgotPassword() {
  return (
    <PublicPage title={'Forgot your password?'} subtitle={'Enter your email to get a reset link'}>
      <TextInput label="Your email" placeholder="email@example.com" required />
      <Group justify="space-between" mt="lg" className={classes.controls}>
        <Anchor c="dimmed" size="sm" className={classes.control} href={'/login'}>
          <Center inline>
            <ArrowLeft size={12} />
            <Box ml={5}>Back to the login page</Box>
          </Center>
        </Anchor>
        <Button className={classes.control}>Reset password</Button>
      </Group>
    </PublicPage>
  );
}
