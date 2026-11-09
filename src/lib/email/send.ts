import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';
import { sanitizeError } from '@/lib/redact';
import { getEmailFrom, getEmailProvider } from './config';
import { type EmailTemplateProps, type EmailType, emailTemplates } from './templates';

/**
 * Renders and sends a typed email. Never throws: failures are logged and reported
 * so callers (e.g. forgot-password) can't leak delivery state to the client.
 * Returns whether the provider accepted the message.
 */
export async function sendEmail<T extends EmailType>(
  type: T,
  to: string,
  props: EmailTemplateProps[T],
): Promise<boolean> {
  try {
    const rendered = emailTemplates[type](props);
    await getEmailProvider().send({ to, ...rendered }, getEmailFrom());
    return true;
  } catch (error) {
    const safeError = sanitizeError(error);
    logger.error('Failed to send email', safeError, { type });
    Sentry.captureException(safeError, { tags: { emailType: type } });
    return false;
  }
}
