'use client';

import { IconCalendarCheck } from '@tabler/icons-react';
import { DEADLINE_TABS, type DeadlineTab, type DeadlinesResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { Tabs } from '@/components/base/tabs/tabs';
import { useGetDeadlinesQuery } from '@/lib/api/deadlines-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { DeadlineRow } from './deadline-row';

const PAGE_SIZE = 25;

interface RowsProps {
  data: DeadlinesResponse;
  tab: DeadlineTab;
  onPage: (page: number) => void;
}

function Rows({ data, tab, onPage }: RowsProps) {
  const t = useTranslations('deadlines.empty');
  // Fixed while the rows are on screen, so a label does not change under the reader.
  const [now] = useState(() => new Date());

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={IconCalendarCheck}
        title={t(`${tab}.title`)}
        description={t(`${tab}.text`)}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {data.items.map((item) => (
          <DeadlineRow key={`${item.kind}:${item.id}`} item={item} now={now} />
        ))}
      </ul>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={onPage}
      />
    </>
  );
}

/** Every dated job in the company on one page: what is late, what falls due this week, and what is coming. */
export function DeadlinesPage() {
  const t = useTranslations('pages.deadlines');
  const tTabs = useTranslations('deadlines.tabs');
  const errorMessage = useErrorMessage();
  const [tab, setTab] = useState<DeadlineTab>('overdue');
  const [page, setPage] = useState(1);
  const { data, error } = useGetDeadlinesQuery({ tab, page, limit: PAGE_SIZE });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => {
            setTab(key);
            setPage(1);
          }}
          tabs={DEADLINE_TABS.map((id) => ({
            id,
            label: tTabs(id, { count: data.counts[id] }),
            content: <Rows data={data} tab={tab} onPage={setPage} />,
          }))}
        />
      ) : null}
    </>
  );
}
