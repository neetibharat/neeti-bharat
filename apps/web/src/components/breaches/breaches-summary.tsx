'use client';

import type { BreachCounts } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { StatTile } from '@/components/base/stat-tile/stat-tile';

/** Three numbers on top: breaches open, breaches whose Board report is late, and breaches closed. */
export function BreachesSummary({ counts }: { counts: BreachCounts }) {
  const t = useTranslations('breaches.summary');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile label={t('open')} value={counts.open} note={t('openNote')} tone="accent" />
      <StatTile label={t('overdue')} value={counts.overdue} note={t('overdueNote')} tone="danger" />
      <StatTile label={t('closed')} value={counts.closed} note={t('closedNote')} />
    </div>
  );
}
