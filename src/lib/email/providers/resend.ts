import { redactSecrets } from '@/lib/redact';
import type { EmailProvider } from '../types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Resend via its REST API (no SDK dependency). */
export function createResendProvider(apiKey: string): EmailProvider {
  return {
    name: 'resend',
    async send(message, from) {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Resend request failed (${response.status}): ${redactSecrets(detail).slice(0, 200)}`);
      }
    },
  };
}
