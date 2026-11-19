import { setRequestLocale } from 'next-intl/server';
import { CertificatePage } from '@/components/training/certificate-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function CertificateRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(requireLocale((await params).locale));

  return <CertificatePage />;
}
