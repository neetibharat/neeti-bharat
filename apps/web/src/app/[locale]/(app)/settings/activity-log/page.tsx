import { setRequestLocale } from 'next-intl/server';
import { ActivityLog } from '@/components/activity/activity-log';
import { requireLocale } from '@/i18n/require-locale';
import { requireAdmin } from '@/lib/server-session';

export default async function ActivityLogPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  await requireAdmin(locale);

  return <ActivityLog />;
}
