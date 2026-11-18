'use client';

import { IconWorldSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { useGetWebsiteChecksQuery } from '@/lib/api/website-check-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { CheckForm } from './check-form';
import { CheckHistory } from './check-history';
import { CheckResults } from './check-results';

/** Visit the public site and see what a visitor, and an auditor, would find. */
export function WebsiteCheckPage() {
  const t = useTranslations('websiteCheck');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const [shown, setShown] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const latest = useGetWebsiteChecksQuery(1);

  if (latest.error) return <Alert tone="error">{errorMessage(latest.error)}</Alert>;
  if (!latest.data) return <Loading />;
  const shownId = shown ?? latest.data.items[0]?.id;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-col gap-6">
        {canEdit && <CheckForm onDone={setShown} />}
        {shownId ? (
          <CheckResults id={shownId} />
        ) : (
          <Card variant="dashed">
            <EmptyState
              icon={IconWorldSearch}
              title={t('empty.title')}
              description={t(canEdit ? 'empty.canRun' : 'empty.readOnly')}
            />
          </Card>
        )}
        <CheckHistory page={page} onPage={setPage} onSelect={setShown} />
      </div>
    </>
  );
}
