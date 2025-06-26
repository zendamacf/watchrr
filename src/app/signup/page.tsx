import { signup } from '@/actions/auth/actions';
import { createClient } from '@/utils/supabase/server';
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { redirect } from 'next/navigation';
import classes from './page.module.css';

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/');
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        Sign Up
      </Title>

      <Text className={classes.subtitle}>
        Already have an account? <Anchor href={'/signin'}>Sign In</Anchor>
      </Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <form action={signup}>
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
          <Button type="submit" fullWidth mt="xl" radius="md">
            Sign Up
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
