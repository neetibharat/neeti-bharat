import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { RulePage } from '@/components/frameworks/rule-page';
import { requireLocale } from '@/i18n/require-locale';
import { canEdit } from '@/lib/permissions';
import { decodeParam } from '@/lib/route-param';
import { getCurrentUser } from '@/lib/server-session';

interface RuleRouteProps {
  params: Promise<{ locale: string; framework: string; id: string }>;
}

export default async function RuleRoute({ params }: RuleRouteProps) {
  const { locale, framework, id } = await params;
  setRequestLocale(requireLocale(locale));
  const frameworkId = decodeParam(framework);
  const ruleId = decodeParam(id);
  if (frameworkId === null || ruleId === null) notFound();
  const user = await getCurrentUser();

  return <RulePage frameworkId={frameworkId} ruleId={ruleId} canEdit={canEdit(user)} />;
}
