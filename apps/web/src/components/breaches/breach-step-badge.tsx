import type { BreachStep } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';

/** The step to do next. A closed breach has none. */
export function BreachStepBadge({ step }: { step: BreachStep | null }) {
  const t = useTranslations('breaches');
  if (step === null) return <Badge>{t('badge.closed')}</Badge>;
  return <Badge color="brand">{t(`steps.${step}`)}</Badge>;
}
