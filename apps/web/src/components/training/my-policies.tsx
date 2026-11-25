'use client';

import { IconFileCheck } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { useGetMyPoliciesQuery } from '@/lib/api/policy-acceptance-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { PolicyList } from './policy-list';

/** The approved policies, for the signed-in person to read and accept. */
export function MyPolicies() {
  const t = useTranslations('training.policies');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const { data, error } = useGetMyPoliciesQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  if (data.items.length === 0) {
    return <EmptyState icon={IconFileCheck} title={t('none.title')} description={t('none.body')} />;
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-fg-muted">{data.acceptedAll ? t('allDone') : t('about')}</p>
      <PolicyList items={data.items} canAct={canEdit} />
    </div>
  );
}
