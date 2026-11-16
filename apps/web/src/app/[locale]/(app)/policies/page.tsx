import { setRequestLocale } from 'next-intl/server';
import { PoliciesPage } from '@/components/policies/policies-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function PoliciesRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <PoliciesPage />;
}
