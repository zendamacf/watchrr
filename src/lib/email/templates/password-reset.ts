import { DISPLAY_FONT_STACK, emailColors, escapeHtml, renderButton, renderLayout } from './layout';

export type PasswordResetProps = {
  resetUrl: string;
  expiresInMinutes: number;
};

export function passwordResetTemplate({ resetUrl, expiresInMinutes }: PasswordResetProps) {
  return {
    subject: 'Reset your Watchrr password',
    html: renderLayout(
      `<h1 style="font-family:${DISPLAY_FONT_STACK};font-size:24px;line-height:1.2;margin:0 0 12px;">Reset your password</h1>
      <p style="margin:0 0 20px;">We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="margin:0 0 24px;">${renderButton(resetUrl, 'Reset password')}</p>
      <p class="muted" style="margin:0;font-size:13px;color:${emailColors.light.muted};">This link expires in ${expiresInMinutes} minutes and can only be used once. If you didn't request this, you can safely ignore this email.</p>
      <p class="muted" style="margin:16px 0 0;font-size:12px;color:${emailColors.light.muted};word-break:break-all;">Button not working? Paste this link into your browser:<br>${escapeHtml(resetUrl)}</p>`,
    ),
    text: `We received a request to reset your password.\n\nReset it here: ${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes and can only be used once. If you didn't request this, you can ignore this email.`,
  };
}
