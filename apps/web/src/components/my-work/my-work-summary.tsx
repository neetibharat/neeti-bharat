'use client';

import type { MyWorkItem } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { StatTile } from '@/components/base/stat-tile/stat-tile';

/** Four numbers on top: what is late, what needs a decision, and how much proof and policy work there is. */
export function MyWorkSummary({ items }: { items: MyWorkItem[] }) {
  const t = useTranslations('dashboard.work.summary');
  const count = (kinds: string[]) => items.filter((i) => kinds.includes(i.kind)).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile label={t('overdue')} value={items.filter((i) => i.overdue).length} tone="danger" />
      <StatTile label={t('approve')} value={count(['approve'])} tone="accent" />
      <StatTile label={t('proof')} value={count(['proof'])} tone="brand" />
      <StatTile label={t('policies')} value={count(['review', 'draft'])} />
    </div>
  );
}
