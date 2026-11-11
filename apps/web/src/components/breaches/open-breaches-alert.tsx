'use client';

import type { BreachListResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Link } from '@/i18n/navigation';
import { useNow } from '@/lib/hooks/use-now';
import { BreachClockBadge } from './breach-clock-badge';

/** Open breaches at the very top of the Dashboard, for everyone, until each one is closed. */
export function OpenBreachesAlert({ data }: { data: BreachListResponse }) {
  const t = useTranslations('breaches.alert');
  const now = useNow();
  if (data.counts.open === 0) return null;
  const more = data.counts.open - data.items.length;

  return (
    <Alert tone="error" title={t('title', { count: data.counts.open })} className="mb-5">
      <ul className="flex flex-col gap-1.5">
        {data.items.map((breach) => (
          <li key={breach.id} className="flex flex-wrap items-center gap-2">
            <Link href={`/breaches/${breach.id}`} className="font-medium underline">
              {breach.title}
            </Link>
            <BreachClockBadge
              reportDueAt={breach.reportDueAt}
              currentStep={breach.currentStep}
              now={now}
            />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-label">
        {more > 0 && `${t('more', { count: more })} `}
        <Link href="/breaches" className="font-medium underline">
          {t('all')}
        </Link>
      </p>
    </Alert>
  );
}
