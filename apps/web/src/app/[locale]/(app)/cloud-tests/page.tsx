import { setRequestLocale } from 'next-intl/server';
import { CloudTestsPage } from '@/components/cloud-tests/cloud-tests-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function CloudTestsRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <CloudTestsPage />;
}
