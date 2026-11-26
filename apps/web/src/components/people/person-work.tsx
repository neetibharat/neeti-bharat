'use client';

import type { MyWorkload } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Link } from '@/i18n/navigation';

/** How much is waiting on this person, with a link to see it. */
export function PersonWork({ personId, work }: { personId: string; work?: MyWorkload }) {
  const t = useTranslations('people.work');
  if (!work || work.open === 0) return <span className="text-fg-subtle">{t('none')}</span>;

  return (
    <Link
      href={`/my-work?person=${encodeURIComponent(personId)}`}
      aria-label={t('view')}
      className="flex flex-wrap items-center gap-1.5 text-label font-medium text-fg hover:text-brand"
    >
      {t('open', { count: work.open })}
      {work.overdue > 0 && <Badge color="danger">{t('overdue', { count: work.overdue })}</Badge>}
    </Link>
  );
}
