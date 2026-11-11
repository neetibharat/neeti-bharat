import type { MailMessage } from '../../core/mail/mail.service';
import { renderMail } from '../../core/mail/templates';

export const MAGIC_LINK_MINUTES = 5;

export function signInEmail(to: string, url: string): MailMessage {
  return { to, ...renderMail('en', 'signIn', { url, minutes: MAGIC_LINK_MINUTES }) };
}
