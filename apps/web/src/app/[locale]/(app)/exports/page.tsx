import { setRequestLocale } from 'next-intl/server';
import { ExportsPage } from '@/components/exports/exports-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function ExportsRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <ExportsPage />;
}
