'use client';

import { IconAlertTriangle, IconSearch } from '@tabler/icons-react';
import {
  BREACH_PAGE_SIZE,
  BREACH_TABS,
  type BreachListResponse,
  type BreachTab,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Input } from '@/components/base/input/input';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { Loading } from '@/components/base/loading/loading';
import { Tabs } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import { useGetBreachesQuery } from '@/lib/api/breaches-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { BreachesSummary } from './breaches-summary';
import { BreachesTable } from './breaches-table';
import { ReportBreachButton } from './report-breach-button';

/** The breaches on the open tab or the closed one, a message when there are none, and the page controls. */
function Rows(props: {
  data: BreachListResponse;
  tab: BreachTab;
  isSearching: boolean;
  onPage: (page: number) => void;
}) {
  const t = useTranslations('breaches.empty');
  const { canEdit } = useCan();
  const { data, tab } = props;

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={IconAlertTriangle}
        title={t(props.isSearching ? 'noMatch' : `${tab}Title`)}
        description={props.isSearching ? undefined : t(`${tab}Text`)}
        action={
          canEdit && tab === 'open' && !props.isSearching ? (
            <ReportBreachButton openFromLink={false} />
          ) : undefined
        }
      />
    );
  }
  return (
    <>
      <BreachesTable breaches={data.items} />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}

/** What the person has chosen: the tab, the search and the page. Changing the tab or the search goes back to page one. */
function useBreachView() {
  const [tab, setTab] = useState<BreachTab>('open');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(text.trim());

  return {
    tab,
    text,
    setPage,
    setTab: (next: BreachTab) => {
      setTab(next);
      setPage(1);
    },
    setText: (next: string) => {
      setText(next);
      setPage(1);
    },
    query: { tab, q: q || undefined, page, limit: BREACH_PAGE_SIZE },
  };
}

/** Every breach, open or closed, one page at a time, with the report clock of each. */
export function BreachesPage() {
  const t = useTranslations('pages.breaches');
  const tBreaches = useTranslations('breaches');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const view = useBreachView();
  const { data, error } = useGetBreachesQuery(view.query);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={canEdit ? <ReportBreachButton /> : undefined}
      />
      <div className="flex flex-col gap-4">
        <BreachesSummary counts={data.counts} />
        <Input
          aria-label={tBreaches('search')}
          placeholder={tBreaches('search')}
          iconLeading={IconSearch}
          value={view.text}
          onChange={view.setText}
          className="max-w-sm"
        />
        <BreachTabs data={data} view={view} />
      </div>
    </>
  );
}

/** One tab per state, each labelled with how many it holds. Only the open one is on screen. */
function BreachTabs(props: { data: BreachListResponse; view: ReturnType<typeof useBreachView> }) {
  const t = useTranslations('breaches.tabs');
  const { data, view } = props;
  const rows = (
    <Rows data={data} tab={view.tab} isSearching={view.text.trim() !== ''} onPage={view.setPage} />
  );

  return (
    <Tabs
      selectedKey={view.tab}
      onSelectionChange={view.setTab}
      tabs={BREACH_TABS.map((id) => ({
        id,
        label: t(id, { count: data.counts[id] }),
        content: rows,
      }))}
    />
  );
}
