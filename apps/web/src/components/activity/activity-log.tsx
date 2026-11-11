'use client';

import { IconHistory } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { useListActivityInfiniteQuery } from '@/lib/api/activity-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ActivityFilter, type ActivityFilterValue } from './activity-filter';
import { ActivityTable } from './activity-table';
import { IntegrityCheck } from './integrity-check';

export function ActivityLog() {
  const t = useTranslations('activity');
  const [filter, setFilter] = useState<ActivityFilterValue>('all');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Card>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <ActivityFilter value={filter} onChange={setFilter} />
          <IntegrityCheck />
        </div>
        <ActivityEvents action={filter === 'all' ? undefined : filter} />
      </Card>
    </>
  );
}

function ActivityEvents({ action }: { action?: Exclude<ActivityFilterValue, 'all'> }) {
  const t = useTranslations('activity');
  const errorMessage = useErrorMessage();
  const { data, error, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useListActivityInfiniteQuery({ action });

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (isLoading) return null;
  const events = data?.pages.flatMap((page) => page.items) ?? [];
  if (!events.length) {
    return <EmptyState icon={IconHistory} title={t(action ? 'emptyFiltered' : 'empty')} />;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full">
        <ActivityTable events={events} />
      </div>
      {hasNextPage && (
        <Button
          color="secondary"
          isLoading={isFetchingNextPage}
          onPress={() => void fetchNextPage()}
        >
          {t('loadMore')}
        </Button>
      )}
    </div>
  );
}
