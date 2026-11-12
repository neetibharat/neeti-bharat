'use client';

import { IconKey, IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { useGetApiKeysQuery } from '@/lib/api/api-keys-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ApiKeysTable } from './api-keys-table';
import { CreateKeyButton } from './create-key-button';

/** Keys for scripts and AI agents. Only admins reach it. */
export function ApiKeysPage() {
  const t = useTranslations('apiKeys');
  const errorMessage = useErrorMessage();
  const [page, setPage] = useState(1);
  const { data, error } = useGetApiKeysQuery(page);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <CreateKeyButton trigger={<Button iconLeading={IconPlus}>{t('create')}</Button>} />
        }
      />
      <div className="flex flex-col gap-5">
        {data.items.length === 0 ? (
          <Card variant="dashed">
            <EmptyState icon={IconKey} title={t('empty.title')} description={t('empty.body')} />
          </Card>
        ) : (
          <>
            <ApiKeysTable keys={data.items} />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
        <Card title={t('usage.title')} description={t('usage.body')} />
      </div>
    </>
  );
}
