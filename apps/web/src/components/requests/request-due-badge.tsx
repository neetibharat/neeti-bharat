import type { RequestStatus } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { timeLeft } from '@/lib/breach-clock';
import { dueState } from '@/lib/request-due';

export interface RequestDueBadgeProps {
  status: RequestStatus;
  dueAt: string;
  now: Date;
}

/** Time left to reply, or how late it is. A request that is done has no clock. */
export function RequestDueBadge({ status, dueAt, now }: RequestDueBadgeProps) {
  const t = useTranslations('requests.badge');
  const state = dueState({ status, dueAt }, now);
  if (state === 'done') return <Badge>{t('done')}</Badge>;

  const { overdue, ...words } = timeLeft(dueAt, now);
  if (overdue) return <Badge color="danger">{t('overdue', words)}</Badge>;
  return <Badge color={state === 'soon' ? 'warning' : 'gray'}>{t('left', words)}</Badge>;
}
