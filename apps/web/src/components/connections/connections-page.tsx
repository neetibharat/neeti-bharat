'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { useCan } from '@/components/providers/user-provider';
import { useGetConnectionsQuery } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ConnectionCard } from './connection-card';
import { ProviderCatalog } from './provider-catalog';

/** The systems DPDP Kit reads to check them and what the checks found, then the systems that can be connected. */
export function ConnectionsPage() {
  const t = useTranslations('connections');
  const errorMessage = useErrorMessage();
  const { isAdmin } = useCan();
  const [page, setPage] = useState(1);
  const { data, error } = useGetConnectionsQuery(page);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex max-w-6xl flex-col gap-10">
        {!data.enabled && <Alert tone="info">{t('secretsOff')}</Alert>}
        {data.items.length > 0 && (
          <div className="flex max-w-5xl flex-col gap-8">
            {data.items.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} />
            ))}
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
        <ProviderCatalog connections={data.items} enabled={data.enabled} isAdmin={isAdmin} />
      </div>
    </>
  );
}
