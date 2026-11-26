'use client';

import { IconSearch } from '@tabler/icons-react';
import { REQUEST_TYPES, type RequestCounts } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Input } from '@/components/base/input/input';
import { Select, type SelectOption } from '@/components/base/select/select';
import { ALL } from '@/lib/filters';
import type { RequestViewMode } from '@/lib/request-board';
import { RequestsSummary } from './requests-summary';
import { RequestsViewSwitch } from './requests-view-switch';
import type { RequestView, TypeFilter } from './use-request-view';

/** The search box and the type filter, which narrow the board and the list alike. */
function Filters({ view }: { view: RequestView }) {
  const t = useTranslations('requests');
  const tTypes = useTranslations('requests.types');
  const options: SelectOption<TypeFilter>[] = [
    { id: ALL, label: t('allTypes') },
    ...REQUEST_TYPES.map((id) => ({ id, label: tTypes(id) })),
  ];

  return (
    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        iconLeading={IconSearch}
        value={view.text}
        onChange={view.setText}
      />
      <Select
        aria-label={t('filterType')}
        options={options}
        selectedKey={view.type}
        onSelectionChange={view.setType}
      />
    </div>
  );
}

export interface RequestsFrameProps {
  counts: RequestCounts;
  view: RequestView;
  mode: RequestViewMode;
  children: ReactNode;
}

/** What the board and the list share: the four figures, the filters and the Board | List switch above the requests. */
export function RequestsFrame({ counts, view, mode, children }: RequestsFrameProps) {
  return (
    <div className="flex flex-col gap-4">
      <RequestsSummary counts={counts} />
      <div className="flex flex-wrap items-center gap-3">
        <Filters view={view} />
        <RequestsViewSwitch mode={mode} />
      </div>
      {children}
    </div>
  );
}
