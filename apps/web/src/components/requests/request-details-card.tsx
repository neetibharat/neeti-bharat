'use client';

import type { RequestResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { RequestAssignee } from './request-assignee';

function Item({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="text-label font-medium text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-body whitespace-pre-line text-fg">{children}</dd>
    </div>
  );
}

/** What the person asked for, how to reach them, and where and when it arrived. */
export function RequestDetailsCard({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.detail');
  const tSources = useTranslations('requests.sources');
  const format = useFormatter();
  const received = format.dateTime(new Date(request.receivedAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Card title={t('detailsTitle')}>
      <dl className="flex flex-col gap-4">
        <Item label={t('details')}>{request.details}</Item>
        <Item label={t('email')}>{request.personEmail}</Item>
        <Item label={t('received')}>{received}</Item>
        <Item label={t('source')}>{tSources(request.source)}</Item>
      </dl>
      <RequestAssignee request={request} />
    </Card>
  );
}
