'use client';

import { IconSearch } from '@tabler/icons-react';
import { PEOPLE_PAGE_SIZE, type PeopleCounts, type PeopleListResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Input } from '@/components/base/input/input';
import { Pagination } from '@/components/base/pagination/pagination';
import { Tabs } from '@/components/base/tabs/tabs';
import { useGetMyWorkTeamQuery } from '@/lib/api/my-work-api';
import { useGetPeopleQuery } from '@/lib/api/people-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { PeopleSummary } from './people-summary';
import { PeopleTable } from './people-table';

type Status = 'active' | 'left';

/** The people on the current page, a message when nobody matches, and the page controls. */
function Rows(props: { data: PeopleListResponse; onPage: (page: number) => void }) {
  const t = useTranslations('people');
  const { data } = props;
  const { data: team } = useGetMyWorkTeamQuery();
  const work = new Map((team?.members ?? []).map((member) => [member.personId, member]));

  if (data.people.length === 0) {
    return <p className="py-6 text-center text-body text-fg-muted">{t('noMatch')}</p>;
  }
  return (
    <>
      <PeopleTable people={data.people} work={work} />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}

function useStatusTabs(counts: PeopleCounts | undefined, rows: React.ReactNode) {
  const t = useTranslations('people.tabs');
  return (['active', 'left'] as const).map((status) => ({
    id: status,
    label: t(status, { count: counts?.[status] ?? 0 }),
    content: rows,
  }));
}

/** Summary tiles, a search that runs on the server, and active and left people one page at a time. */
export function PeopleDirectory() {
  const t = useTranslations('people');
  const errorMessage = useErrorMessage();
  const [status, setStatus] = useState<Status>('active');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(text.trim());
  const { data, error } = useGetPeopleQuery({
    status,
    q: q || undefined,
    page,
    limit: PEOPLE_PAGE_SIZE,
  });
  const tabs = useStatusTabs(data?.counts, data && <Rows data={data} onPage={setPage} />);

  return (
    <div className="flex flex-col gap-4">
      <PeopleSummary counts={data?.counts} />
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
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <Tabs
        selectedKey={status}
        onSelectionChange={(key) => {
          setStatus(key);
          setPage(1);
        }}
        tabs={tabs}
      />
    </div>
  );
}
