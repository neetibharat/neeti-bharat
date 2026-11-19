import { setRequestLocale } from 'next-intl/server';
import { VendorDetailPage } from '@/components/vendors/vendor-detail-page';
import { requireLocale } from '@/i18n/require-locale';

interface VendorRouteProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function VendorRoute({ params }: VendorRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(requireLocale(locale));

  return <VendorDetailPage vendorId={id} />;
}
