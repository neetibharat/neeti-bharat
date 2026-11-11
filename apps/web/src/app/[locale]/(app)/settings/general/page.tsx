import { setRequestLocale } from 'next-intl/server';
import { GeneralSettings } from '@/components/profile/general-settings';
import { requireLocale } from '@/i18n/require-locale';
import { requireAdmin } from '@/lib/server-session';

export default async function GeneralPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  await requireAdmin(locale);

  return <GeneralSettings />;
}
