import { setRequestLocale } from 'next-intl/server';
import { PreferencesPage } from '@/components/notifications/preferences-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function NotificationSettingsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(requireLocale((await params).locale));

  return <PreferencesPage />;
}
