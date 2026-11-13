import { setRequestLocale } from 'next-intl/server';
import { NotificationsPage } from '@/components/notifications/notifications-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function NotificationsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(requireLocale((await params).locale));

  return <NotificationsPage />;
}
