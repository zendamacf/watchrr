import { signin } from '@/actions/auth/actions';
import { createClient } from '@/utils/supabase/server';
import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { redirect } from 'next/navigation';
import classes from './page.module.css';

export default async function SignInPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/');
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        Welcome back!
      </Title>

      <Text className={classes.subtitle}>
        Do not have an account yet? <Anchor href={'/signup'}>Create account</Anchor>
      </Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <form action={signin}>
          <TextInput
            label="Email"
            name="email"
            placeholder="email@example.com"
            required
            radius="md"
          />
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Your password"
            required
            mt="md"
            radius="md"
          />
          <Group justify="space-between" mt="lg">
            <Anchor component="button" size="sm" href={'/forgot-password'}>
              Forgot password?
            </Anchor>
          </Group>
          <Button type={'submit'} fullWidth mt="xl" radius="md">
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
