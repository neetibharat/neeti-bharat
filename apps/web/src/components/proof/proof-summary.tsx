'use client';

import type { ProofCounts } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { cx } from '@/lib/utils/cx';

type Figure = 'overdue' | 'missing' | 'due' | 'provided';

const FIGURES: Figure[] = ['overdue', 'missing', 'due', 'provided'];
const TONES: Record<Figure, string> = {
  overdue: 'text-danger',
  missing: 'text-fg',
  due: 'text-accent',
  provided: 'text-success',
};

/** How much proof is overdue, missing, due again and in, as four figures. */
export function ProofSummary({ counts }: { counts: ProofCounts }) {
  const t = useTranslations('proofPage.summary');

  return (
    <Card padding="none">
      <dl className="grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
        {FIGURES.map((figure) => (
          <div key={figure} className="px-5 py-4">
            <dt className="text-label text-fg-muted">{t(figure)}</dt>
            <dd
              className={cx(
                'mt-1 text-stat font-medium tracking-tight tabular-nums',
                TONES[figure],
              )}
            >
              {counts[figure]}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
