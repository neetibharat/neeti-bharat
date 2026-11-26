'use client';

import { policyLabel } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { useCan } from '@/components/providers/user-provider';
import { useGetArchivedPoliciesQuery, useRestorePolicyMutation } from '@/lib/api/policy-edit-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Policies that were archived. They do not count until restored. Shown only when there are some. */
export function ArchivedPolicies() {
  const t = useTranslations('policies.archived');
  const { canEdit } = useCan();
  const errorMessage = useErrorMessage();
  const { data } = useGetArchivedPoliciesQuery();
  const [restore, { isLoading, error }] = useRestorePolicyMutation();
  const policies = data?.policies ?? [];
  if (policies.length === 0) return null;

  return (
    <Card title={t('title')} description={t('description')}>
      <ul className="divide-y divide-line">
        {policies.map((policy) => (
          <li key={policy.id} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-body text-fg">{policyLabel(policy)}</span>
            {canEdit && (
              <Button
                color="secondary"
                size="sm"
                isDisabled={isLoading}
                onPress={() => void restore(policy.id)}
              >
                {t('restore')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error ? (
        <Alert tone="error" className="mt-3">
          {errorMessage(error)}
        </Alert>
      ) : null}
    </Card>
  );
}
