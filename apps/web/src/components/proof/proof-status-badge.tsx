'use client';

import type { ProofStatus } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';

const COLORS = { missing: 'gray', provided: 'success', due: 'warning' } as const;

/** Where a piece of required proof stands: not given yet, given and good, or given but out of date. */
export function ProofStatusBadge({ status }: { status: ProofStatus }) {
  const t = useTranslations('frameworks.proof.status');
  return <Badge color={COLORS[status]}>{t(status)}</Badge>;
}
