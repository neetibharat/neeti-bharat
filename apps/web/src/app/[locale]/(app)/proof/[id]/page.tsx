import { setRequestLocale } from 'next-intl/server';
import { RequirementPage } from '@/components/proof/requirement-page';
import { requireLocale } from '@/i18n/require-locale';

interface RequirementRouteProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function RequirementRoute({ params }: RequirementRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(requireLocale(locale));

  return <RequirementPage requirementId={id} />;
}
