'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/base/page-header/page-header';
import { useCan } from '@/components/providers/user-provider';
import type { RequestViewMode } from '@/lib/request-board';
import { LogRequestButton } from './log-request-button';
import { RequestsBoard } from './requests-board';
import { RequestsListView } from './requests-list-view';
import { useRequestView } from './use-request-view';

/** Every request, as a board of new, in progress and done or as a list one page at a time. The address says which. */
export function RequestsPage({ mode }: { mode: RequestViewMode }) {
  const t = useTranslations('pages.requests');
  const { canEdit } = useCan();
  const view = useRequestView();

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={canEdit ? <LogRequestButton /> : undefined}
      />
      {mode === 'board' ? <RequestsBoard view={view} /> : <RequestsListView view={view} />}
    </>
  );
}
