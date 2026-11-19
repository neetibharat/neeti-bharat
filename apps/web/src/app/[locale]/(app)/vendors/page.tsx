import { setRequestLocale } from 'next-intl/server';
import { VendorsPage } from '@/components/vendors/vendors-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function VendorsRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <VendorsPage />;
}
