import { consoleProvider } from './providers/console';
import { createResendProvider } from './providers/resend';
import type { EmailProvider } from './types';

const DEFAULT_FROM = 'Watchrr <onboarding@resend.dev>';

/** True when a real provider is configured (otherwise emails are only logged). */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

/** Public base URL used to build links in emails (no trailing slash). */
export function getAppUrl(): string {
  const raw = process.env.APP_URL?.trim() || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  return apiKey ? createResendProvider(apiKey) : consoleProvider;
}
