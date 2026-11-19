'use client';

import { POLICY_STATUSES } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { StackedBars, type BarRow } from '@/components/graphs/stacked-bars';
import type { OwnerCounts } from '@/lib/policy-stats';
import { STATUS_COLORS } from './chart-style';

/** Who owns the policies and how far along each owner is, one bar per job split by status. */
export function OwnerBars({ owners }: { owners: OwnerCounts[] }) {
  const t = useTranslations('policies.overview');
  const tStatus = useTranslations('policies.status');
  const tJobs = useTranslations('jobRoles');
  const rows: BarRow[] = owners.map((owner) => ({
    label: tJobs(owner.role),
    segments: POLICY_STATUSES.map((status) => ({
      key: status,
      label: tStatus(status),
      value: owner[status],
      color: STATUS_COLORS[status],
    })),
  }));

  return (
    <Card title={t('owner.title')} description={t('owner.description')}>
      <div role="img" aria-label={t('owner.summary', { count: owners.length })}>
        <StackedBars rows={rows} />
      </div>
    </Card>
  );
}
