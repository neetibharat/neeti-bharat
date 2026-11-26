'use client';

import type { PolicyStatus } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';

const COLORS = { draft: 'gray', in_review: 'warning', approved: 'success' } as const;

/** Where a policy stands, as a coloured tag. */
export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const t = useTranslations('policies.status');
  return <Badge color={COLORS[status]}>{t(status)}</Badge>;
}
