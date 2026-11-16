import { setRequestLocale } from 'next-intl/server';
import { PolicyDetailPage } from '@/components/policies/policy-detail-page';
import { requireLocale } from '@/i18n/require-locale';

interface PolicyRouteProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PolicyRoute({ params }: PolicyRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(requireLocale(locale));

  return <PolicyDetailPage policyId={id} />;
}
