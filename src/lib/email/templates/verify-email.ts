import { DISPLAY_FONT_STACK, emailColors, escapeHtml, renderButton, renderLayout } from './layout';

export type VerifyEmailProps = {
  verifyUrl: string;
  expiresInHours: number;
};

export function verifyEmailTemplate({ verifyUrl, expiresInHours }: VerifyEmailProps) {
  return {
    subject: 'Confirm your watchrr email address',
    html: renderLayout(
      `<h1 style="font-family:${DISPLAY_FONT_STACK};font-size:24px;line-height:1.2;margin:0 0 12px;">Confirm your email</h1>
      <p style="margin:0 0 20px;">Welcome to watchrr! Click the button below to confirm this email address and finish setting up your account.</p>
      <p style="margin:0 0 24px;">${renderButton(verifyUrl, 'Confirm email')}</p>
      <p class="muted" style="margin:0;font-size:13px;color:${emailColors.light.muted};">This link expires in ${expiresInHours} hours and can only be used once. If you didn't create a watchrr account, you can safely ignore this email.</p>
      <p class="muted" style="margin:16px 0 0;font-size:12px;color:${emailColors.light.muted};word-break:break-all;">Button not working? Paste this link into your browser:<br>${escapeHtml(verifyUrl)}</p>`,
    ),
    text: `Welcome to watchrr! Confirm your email address here: ${verifyUrl}\n\nThis link expires in ${expiresInHours} hours and can only be used once. If you didn't create a watchrr account, you can ignore this email.`,
  };
}
