'use client';

import { PROOF_TABS, type ProofOverviewResponse, type ProofTab } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { useGetProofOverviewQuery } from '@/lib/api/evidence-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { NO_FILTERS, toProofQuery, type ProofFilters } from '@/lib/proof-query';
import { ControlProofPage } from './control-proof-page';
import { ProofFilterBar } from './proof-filters';
import { ProofList } from './proof-list';
import { ProofSummary } from './proof-summary';

/** Everything the company has to be able to show, or, given a control, that control's own page. */
export function ProofPage({ controlId }: { controlId?: string }) {
  return controlId ? <ControlProofPage controlId={controlId} /> : <AllProofPage />;
}

/** Everything the company has to be able to show, one page at a time: overdue, missing, due again and in. */
function AllProofPage() {
  const tPage = useTranslations('pages.proof');
  const errorMessage = useErrorMessage();
  const { filters, setFilters, tab, setTab, setPage, query } = useProofView();
  const { data, error } = useGetProofOverviewQuery(query);
  const tabs = useProofTabs(data, setPage);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader title={tPage('title')} description={tPage('description')} />
      <div className="flex flex-col gap-4">
        <ProofSummary counts={data.counts} />
        <ProofFilterBar rules={data.rules} filters={filters} onChange={setFilters} />
        <Tabs selectedKey={tab} onSelectionChange={setTab} tabs={tabs} />
      </div>
    </>
  );
}

/** What the person has chosen: the filters, the tab and the page. Changing the filters or the tab goes back to page one. */
function useProofView() {
  const [filters, setFilters] = useState<ProofFilters>(NO_FILTERS);
  const [tab, setTab] = useState<ProofTab>('all');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(filters.search);

  return {
    filters,
    setFilters: (next: ProofFilters) => {
      setFilters(next);
      setPage(1);
    },
    tab,
    setTab: (next: ProofTab) => {
      setTab(next);
      setPage(1);
    },
    page,
    setPage,
    query: toProofQuery({ filters: { ...filters, search }, tab, page }),
  };
}

/** One tab per kind of proof, each labelled with how many it holds. Only the open one is on screen. */
function useProofTabs(data: ProofOverviewResponse | undefined, onPage: (page: number) => void) {
  const t = useTranslations('proofPage');
  return PROOF_TABS.map((id) => ({
    id,
    label: t(`tabs.${id}`, { count: data?.counts[id] ?? 0 }),
    content: data ? <ProofList data={data} onPage={onPage} /> : null,
  }));
}
