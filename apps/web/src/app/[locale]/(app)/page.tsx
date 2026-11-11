import { setRequestLocale } from 'next-intl/server';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <DashboardPage />;
}
