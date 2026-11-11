'use client';

import type { BreachResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { BreachAssignee } from './breach-assignee';

function Item({ label, children }: { label: string; children: string | number }) {
  return (
    <div>
      <dt className="text-label font-medium text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-body whitespace-pre-line text-fg">{children}</dd>
    </div>
  );
}

/** What happened, what was affected, and when it was found. */
export function BreachDetailsCard({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches');
  const format = useFormatter();
  const found = format.dateTime(new Date(breach.foundAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Card
      title={t('detail.detailsTitle')}
      description={t('detail.reportedBy', { name: breach.reportedByName })}
    >
      <dl className="flex flex-col gap-4">
        <Item label={t('detail.description')}>{breach.description}</Item>
        <Item label={t('detail.found')}>{found}</Item>
        <Item label={t('detail.systems')}>{breach.affectedSystems}</Item>
        <Item label={t('detail.data')}>{breach.affectedData}</Item>
        <Item label={t('detail.people')}>{breach.peopleAffected ?? t('unknownPeople')}</Item>
      </dl>
      <BreachAssignee breach={breach} />
    </Card>
  );
}
