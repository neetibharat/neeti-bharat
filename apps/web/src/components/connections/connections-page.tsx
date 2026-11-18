'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { useGetConnectionsQuery } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ConnectedAccounts } from './connected-accounts';
import { ProviderCatalog } from './provider-catalog';

/** The accounts that are connected, and the systems that can be connected. Results are on the Cloud checks page. */
export function ConnectionsPage() {
  const t = useTranslations('connections');
  const errorMessage = useErrorMessage();
  const { isAdmin } = useCan();
  const [page, setPage] = useState(1);
  const { data, error } = useGetConnectionsQuery({ page });

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-col gap-10">
        {!data.enabled && <Alert tone="info">{t('secretsOff')}</Alert>}
        {data.total > 0 && (
          <div>
            <ConnectedAccounts
              connections={data.items}
              isAdmin={isAdmin}
              // Removing the last account on a page leaves it empty: step back to the page before.
              onLastRemoved={() => setPage(Math.max(1, page - 1))}
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
        <ProviderCatalog connected={data.counts} enabled={data.enabled} isAdmin={isAdmin} />
      </div>
    </>
  );
}
