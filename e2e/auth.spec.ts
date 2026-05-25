import { expect, test } from '@playwright/test';
import { e2eEmails, seedPassword } from '../src/test/fixtures/user';

test.describe('auth', () => {
  test('redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/episodes');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('signs in and reaches episodes', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill(e2eEmails.login);
    await page.getByLabel('Password').fill(seedPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/episodes/);
  });

  test('signs out and returns to sign in', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill(e2eEmails.login);
    await page.getByLabel('Password').fill(seedPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/episodes/);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/signin/);
  });
});
