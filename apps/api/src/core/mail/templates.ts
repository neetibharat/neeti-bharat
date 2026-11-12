import type { AppRole } from '@dpdp-kit/shared';
import { renderHtml, renderText, type EmailContent } from './email-layout';

export type MailLocale = 'en';

interface TemplateParams {
  signIn: { url: string; minutes: number };
  invitation: {
    url: string;
    days: number;
    /** The organisation the person is invited to, and who invited them. */
    organization: string;
    inviter: string;
    role: AppRole;
  };
}

type MailKey = keyof TemplateParams;
type Template<K extends MailKey> = (params: TemplateParams[K]) => {
  subject: string;
  content: EmailContent;
};

const ROLE_PHRASE: Record<AppRole, string> = {
  admin: 'as an admin',
  member: 'as a member',
  auditor: 'as an auditor, with read-only access',
};

/** Every word of every email lives here, keyed by locale. Only English is written so far. */
const TEMPLATES: Record<MailLocale, { [K in MailKey]: Template<K> }> = {
  en: {
    signIn: ({ url, minutes }) => ({
      subject: 'Your DPDP Kit sign-in link',
      content: {
        preheader: `Your sign-in link works once and expires in ${minutes} minutes.`,
        heading: 'Sign in to DPDP Kit',
        paragraphs: [
          `Use the button below to sign in. The link works once and expires in ${minutes} minutes.`,
        ],
        button: { label: 'Sign in', url },
        note: 'If you did not ask for this, you can ignore this email. Nobody can sign in without the link.',
        footer: 'DPDP Kit. Sent because someone asked to sign in with this email address.',
      },
    }),
    invitation: ({ url, days, organization, inviter, role }) => ({
      subject: `You are invited to ${organization} on DPDP Kit`,
      content: {
        preheader: `${inviter} invited you to ${organization}.`,
        heading: `Join ${organization}`,
        paragraphs: [
          `${inviter} has invited you to ${organization} on DPDP Kit, the toolkit for meeting the DPDP Act, ${ROLE_PHRASE[role]}.`,
          `Open DPDP Kit and enter this email address to get your sign-in link. The invitation is valid for ${days} days.`,
        ],
        button: { label: 'Open DPDP Kit', url },
        footer: 'DPDP Kit. You are receiving this because someone added you to their team.',
      },
    }),
  },
};

/** The subject, plain text and HTML of one email, in the given language. */
export function renderMail<K extends MailKey>(
  locale: MailLocale,
  key: K,
  params: TemplateParams[K],
): { subject: string; text: string; html: string } {
  const { subject, content } = (TEMPLATES[locale][key] as Template<K>)(params);
  return { subject, text: renderText(content), html: renderHtml(content) };
}
