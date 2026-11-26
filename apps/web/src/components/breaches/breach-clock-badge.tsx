import { isBoardPending, type BreachStep } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { timeLeft } from '@/lib/breach-clock';

export interface BreachClockBadgeProps {
  reportDueAt: string;
  /** Null for a closed breach. */
  currentStep: BreachStep | null;
  now: Date;
}

/** Time left for the Board report, or how late it is. The clock stops once the Board is told. */
export function BreachClockBadge({ reportDueAt, currentStep, now }: BreachClockBadgeProps) {
  const t = useTranslations('breaches.badge');
  if (currentStep === null) return <Badge>{t('closed')}</Badge>;
  if (!isBoardPending(currentStep)) return <Badge color="success">{t('boardTold')}</Badge>;

  const { overdue, ...words } = timeLeft(reportDueAt, now);
  if (overdue) return <Badge color="danger">{t('overdue', words)}</Badge>;
  return <Badge color={words.unit === 'days' ? 'gray' : 'warning'}>{t('left', words)}</Badge>;
}
