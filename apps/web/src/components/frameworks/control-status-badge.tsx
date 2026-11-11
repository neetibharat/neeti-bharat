'use client';

import type { ControlStatus } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';

const COLORS = { not_started: 'gray', in_progress: 'warning', done: 'success' } as const;

/** Where a control stands, as a coloured badge. */
export function ControlStatusBadge({ status }: { status: ControlStatus }) {
  const t = useTranslations('frameworks.statuses');
  return <Badge color={COLORS[status]}>{t(status)}</Badge>;
}
