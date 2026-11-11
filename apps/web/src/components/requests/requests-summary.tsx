'use client';

import type { RequestCounts } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { StatTile } from '@/components/base/stat-tile/stat-tile';

/** Four numbers on top: requests that are new, in progress, overdue, and done. */
export function RequestsSummary({ counts }: { counts: RequestCounts }) {
  const t = useTranslations('requests.summary');

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile label={t('new')} value={counts.new} note={t('newNote')} tone="accent" />
      <StatTile
        label={t('inProgress')}
        value={counts.in_progress}
        note={t('inProgressNote')}
        tone="brand"
      />
      <StatTile label={t('overdue')} value={counts.overdue} note={t('overdueNote')} tone="danger" />
      <StatTile label={t('done')} value={counts.done} note={t('doneNote')} />
    </div>
  );
}
