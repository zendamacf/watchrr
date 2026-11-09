import { logger } from '@/lib/logger';
import type { EmailProvider } from '../types';

/** Logs emails instead of sending them. Used in dev and when no API key is configured. */
export const consoleProvider: EmailProvider = {
  name: 'console',
  async send(message, from) {
    logger.info('Email (console provider, not sent)', {
      from,
      to: message.to,
      subject: message.subject,
      // Bodies can contain credentials (e.g. reset links), so only log them outside production.
      ...(process.env.NODE_ENV === 'production' ? {} : { text: message.text }),
    });
  },
};
