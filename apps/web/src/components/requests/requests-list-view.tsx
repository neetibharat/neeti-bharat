'use client';

import { IconInbox } from '@tabler/icons-react';
import { REQUEST_TABS, type RequestListResponse, type RequestTab } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Pagination } from '@/components/base/pagination/pagination';
import { Loading } from '@/components/base/loading/loading';
import { Tabs } from '@/components/base/tabs/tabs';
import { useGetRequestsQuery } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RequestsFrame } from './requests-frame';
import { RequestsTable } from './requests-table';
import type { RequestView } from './use-request-view';

/** The requests on one tab, a message when there are none, and the page controls. */
function Rows(props: {
  data: RequestListResponse;
  tab: RequestTab;
  isFiltering: boolean;
  onPage: (page: number) => void;
}) {
  const t = useTranslations('requests.empty');
  const { data, tab } = props;

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={IconInbox}
        title={props.isFiltering ? t('noMatch') : t(`${tab}.title`)}
        description={props.isFiltering ? undefined : t(`${tab}.text`)}
      />
    );
  }
  return (
    <>
      <RequestsTable requests={data.items} />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}

/** One tab per state, each labelled with how many it holds. Only the open one is on screen. */
function RequestTabs({ data, view }: { data: RequestListResponse; view: RequestView }) {
  const t = useTranslations('requests.tabs');
  const rows = (
    <Rows data={data} tab={view.tab} isFiltering={view.isFiltering} onPage={view.setPage} />
  );

  return (
    <Tabs
      selectedKey={view.tab}
      onSelectionChange={view.setTab}
      tabs={REQUEST_TABS.map((id) => ({
        id,
        label: t(id, { count: data.counts[id] }),
        content: rows,
      }))}
    />
  );
}

/** Every request on tabs for new, in progress and done, one page at a time, with the time left to reply to each. */
export function RequestsListView({ view }: { view: RequestView }) {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetRequestsQuery(view.query);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <RequestsFrame counts={data.counts} view={view} mode="list">
      <RequestTabs data={data} view={view} />
    </RequestsFrame>
  );
}
