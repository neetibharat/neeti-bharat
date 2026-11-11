export type MailLocale = 'en';

interface TemplateParams {
  signIn: { url: string; minutes: number };
  invitation: { url: string; days: number };
}

type MailKey = keyof TemplateParams;
type Template<K extends MailKey> = (params: TemplateParams[K]) => { subject: string; text: string };

/** Every word of every email lives here, keyed by locale. Only English is written so far. */
const TEMPLATES: Record<MailLocale, { [K in MailKey]: Template<K> }> = {
  en: {
    signIn: ({ url, minutes }) => ({
      subject: 'Your DPDP Kit sign-in link',
      text: `Use this link to sign in to DPDP Kit:\n\n${url}\n\nIt works once and expires in ${minutes} minutes. If you did not ask for it, ignore this email.`,
    }),
    invitation: ({ url, days }) => ({
      subject: 'You are invited to DPDP Kit',
      text: `You have been invited to DPDP Kit.\n\nOpen ${url} and enter this email address to get your sign-in link.\nThe invitation is valid for ${days} days.`,
    }),
  },
};

/** The subject and text of one email, in the given language. */
export function renderMail<K extends MailKey>(
  locale: MailLocale,
  key: K,
  params: TemplateParams[K],
): { subject: string; text: string } {
  return (TEMPLATES[locale][key] as Template<K>)(params);
}
