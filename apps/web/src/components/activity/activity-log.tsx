'use client';

import { IconHistory } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { useListActivityQuery } from '@/lib/api/activity-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ActivityFilter, type ActivityFilterValue } from './activity-filter';
import { ActivityTable } from './activity-table';
import { IntegrityCheck } from './integrity-check';

/** Every change, newest first, a page at a time, narrowed by the kind of change. */
export function ActivityLog() {
  const t = useTranslations('activity');
  const [filter, setFilter] = useState<ActivityFilterValue>('all');
  const [page, setPage] = useState(1);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Card>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <ActivityFilter
            value={filter}
            onChange={(next) => {
              setFilter(next);
              setPage(1);
            }}
          />
          <IntegrityCheck />
        </div>
        <ActivityEvents
          action={filter === 'all' ? undefined : filter}
          page={page}
          onPage={setPage}
        />
      </Card>
    </>
  );
}

function ActivityEvents(props: {
  action?: Exclude<ActivityFilterValue, 'all'>;
  page: number;
  onPage: (page: number) => void;
}) {
  const t = useTranslations('activity');
  const errorMessage = useErrorMessage();
  const { data, error, isLoading } = useListActivityQuery({
    action: props.action,
    page: props.page,
  });

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (isLoading || !data) return null;
  if (!data.items.length) {
    return <EmptyState icon={IconHistory} title={t(props.action ? 'emptyFiltered' : 'empty')} />;
  }

  return (
    <>
      <ActivityTable events={data.items} />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}
