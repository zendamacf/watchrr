import { type PasswordResetProps, passwordResetTemplate } from './password-reset';
import { type VerifyEmailProps, verifyEmailTemplate } from './verify-email';

export type RenderedEmail = { subject: string; html: string; text: string };

/**
 * Registry of email types. To add a new email: create a template file returning
 * `RenderedEmail`, then add its props type and renderer here.
 */
export type EmailTemplateProps = {
  passwordReset: PasswordResetProps;
  verifyEmail: VerifyEmailProps;
};

export type EmailType = keyof EmailTemplateProps;

export const emailTemplates: { [K in EmailType]: (props: EmailTemplateProps[K]) => RenderedEmail } = {
  passwordReset: passwordResetTemplate,
  verifyEmail: verifyEmailTemplate,
};
