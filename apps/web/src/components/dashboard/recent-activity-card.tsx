'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { useActivitySentence } from '@/components/activity/use-activity-sentence';
import { Link } from '@/i18n/navigation';
import { useListActivityQuery } from '@/lib/api/activity-api';

const MAX_ROWS = 6;

/** The latest changes anyone made, newest first. Admins only, like the log itself. */
export function RecentActivityCard() {
  const t = useTranslations('dashboard.activity');
  const format = useFormatter();
  const sentence = useActivitySentence();
  const { data } = useListActivityQuery({ page: 1, limit: MAX_ROWS });
  if (!data) return null;
  const events = data.items;

  return (
    <Card
      title={t('title')}
      description={t('description')}
      actions={
        <Link
          href="/settings/activity-log"
          className="text-label font-medium text-brand hover:underline"
        >
          {t('all')}
        </Link>
      }
    >
      {events.length === 0 ? (
        <p className="text-body text-fg-muted">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
              <span className="text-body text-fg">{sentence(event)}</span>
              <span className="text-caption text-fg-muted">
                {event.actorLabel} · {format.relativeTime(new Date(event.occurredAt))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
