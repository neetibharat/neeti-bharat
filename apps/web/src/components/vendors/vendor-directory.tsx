'use client';

import { IconCircleCheck, IconArchive, IconBuildingStore, IconSearch } from '@tabler/icons-react';
import {
  VENDOR_PAGE_SIZE,
  VENDOR_TABS,
  type VendorCounts,
  type VendorListResponse,
  type VendorTab,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Input } from '@/components/base/input/input';
import { Loading } from '@/components/base/loading/loading';
import { Pagination } from '@/components/base/pagination/pagination';
import { Tabs } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import { useGetVendorsQuery } from '@/lib/api/vendors-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { AddVendorButton } from './add-vendor-button';
import { VendorsTable } from './vendors-table';

const EMPTY_ICONS = {
  active: IconBuildingStore,
  attention: IconCircleCheck,
  archived: IconArchive,
} as const;

/** What to say when a tab holds no vendors. A company with none is invited to add its first. */
function NoVendors({ tab, searching }: { tab: VendorTab; searching: boolean }) {
  const t = useTranslations('vendors.empty');
  const { canEdit } = useCan();
  if (searching) return <EmptyState icon={IconSearch} title={t('noMatch')} />;

  return (
    <EmptyState
      icon={EMPTY_ICONS[tab]}
      title={t(`${tab}.title`)}
      description={t(`${tab}.text`)}
      action={canEdit && tab === 'active' ? <AddVendorButton openFromLink={false} /> : undefined}
    />
  );
}

interface RowsProps {
  data: VendorListResponse;
  tab: VendorTab;
  searching: boolean;
  onPage: (page: number) => void;
}

/** The vendors on the current page, a message when none match, and the page controls. */
function Rows(props: RowsProps) {
  const { data } = props;
  if (data.vendors.length === 0) return <NoVendors tab={props.tab} searching={props.searching} />;

  return (
    <>
      <VendorsTable vendors={data.vendors} />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}

function useTabs(counts: VendorCounts | undefined, rows: React.ReactNode) {
  const t = useTranslations('vendors.tabs');
  return VENDOR_TABS.map((tab) => ({
    id: tab,
    label: t(tab, { count: counts?.[tab] ?? 0 }),
    content: rows,
  }));
}

function VendorSearch(props: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations('vendors');

  return (
    <Input
      aria-label={t('search')}
      placeholder={t('search')}
      iconLeading={IconSearch}
      value={props.value}
      onChange={props.onChange}
      className="max-w-sm"
    />
  );
}

/** A search that runs on the server, and the vendors in use, those that need a look, and the archived ones, a page at a time. */
export function VendorDirectory() {
  const errorMessage = useErrorMessage();
  const [tab, setTab] = useState<VendorTab>('active');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(text.trim());
  const { data, error } = useGetVendorsQuery({
    tab,
    q: q || undefined,
    page,
    limit: VENDOR_PAGE_SIZE,
  });
  const tabs = useTabs(
    data?.counts,
    data && <Rows data={data} tab={tab} searching={q !== ''} onPage={setPage} />,
  );

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <div className="flex flex-col gap-4">
      <VendorSearch
        value={text}
        onChange={(value) => {
          setText(value);
          setPage(1);
        }}
      />
      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => {
          setTab(key);
          setPage(1);
        }}
        tabs={tabs}
      />
    </div>
  );
}
