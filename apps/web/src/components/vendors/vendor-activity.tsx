'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useActivitySentence } from '@/components/activity/use-activity-sentence';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { Loading } from '@/components/base/loading/loading';
import { Pagination } from '@/components/base/pagination/pagination';
import { useGetVendorActivityQuery } from '@/lib/api/vendors-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

const PAGE_SIZE = 10;

/** What has been done to this vendor, newest first, a few at a time. */
export function VendorActivityCard({ vendorId }: { vendorId: string }) {
  const t = useTranslations('vendors.activity');
  const errorMessage = useErrorMessage();
  const format = useFormatter();
  const sentence = useActivitySentence();
  const [page, setPage] = useState(1);
  const { data, error } = useGetVendorActivityQuery({ id: vendorId, page, limit: PAGE_SIZE });

  return (
    <Card title={t('title')} description={t('description')}>
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {!data && !error ? <Loading className="min-h-24" /> : null}
      {data && data.items.length === 0 ? (
        <p className="text-body text-fg-muted">{t('empty')}</p>
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          <ul className="flex flex-col divide-y divide-line">
            {data.items.map((event) => (
              <li key={event.id} className="flex flex-col gap-0.5 py-2.5 first:pt-0">
                <span className="text-body text-fg">{sentence(event)}</span>
                <span className="text-caption text-fg-muted">
                  {event.actorLabel} · {format.relativeTime(new Date(event.occurredAt))}
                </span>
              </li>
            ))}
          </ul>
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </Card>
  );
}
