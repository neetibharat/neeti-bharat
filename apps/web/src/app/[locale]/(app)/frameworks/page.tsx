import { setRequestLocale } from 'next-intl/server';
import { FrameworksListPage } from '@/components/frameworks/frameworks-list-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function FrameworksRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <FrameworksListPage />;
}
