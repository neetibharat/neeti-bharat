'use client';

import { IconSearch } from '@tabler/icons-react';
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
import { Input } from '@/components/base/input/input';
import { Loading } from '@/components/base/loading/loading';
import { Pagination } from '@/components/base/pagination/pagination';
import { Tabs } from '@/components/base/tabs/tabs';
import { useGetVendorsQuery } from '@/lib/api/vendors-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { VendorsTable } from './vendors-table';

/** The vendors on the current page, a message when none match, and the page controls. */
function Rows(props: { data: VendorListResponse; onPage: (page: number) => void }) {
  const t = useTranslations('vendors');
  const { data } = props;
  if (data.vendors.length === 0) {
    return <p className="py-6 text-center text-body text-fg-muted">{t('noMatch')}</p>;
  }

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

/** A search that runs on the server, and the vendors in use, those that need a look, and the archived ones, a page at a time. */
export function VendorDirectory() {
  const t = useTranslations('vendors');
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
  const tabs = useTabs(data?.counts, data && <Rows data={data} onPage={setPage} />);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <div className="flex flex-col gap-4">
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        iconLeading={IconSearch}
        value={text}
        onChange={(value) => {
          setText(value);
          setPage(1);
        }}
        className="max-w-sm"
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
