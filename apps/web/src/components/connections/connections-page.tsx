'use client';

import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { useCan } from '@/components/providers/user-provider';
import { useGetConnectionsQuery } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ProviderCatalog } from './provider-catalog';

/** The systems that can be connected. Results and removal are on the Cloud tests page. */
export function ConnectionsPage() {
  const t = useTranslations('connections');
  const errorMessage = useErrorMessage();
  const { isAdmin } = useCan();
  const { data, error } = useGetConnectionsQuery(1);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-col gap-10">
        {!data.enabled && <Alert tone="info">{t('secretsOff')}</Alert>}
        <ProviderCatalog connections={data.items} enabled={data.enabled} isAdmin={isAdmin} />
      </div>
    </>
  );
}
