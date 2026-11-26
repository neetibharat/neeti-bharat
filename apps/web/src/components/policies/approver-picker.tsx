'use client';

import type { PolicyDetailResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Select } from '@/components/base/select/select';
import { useGetAssigneesQuery } from '@/lib/api/control-edit-api';
import { useSetPolicyApproverMutation } from '@/lib/api/policy-edit-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

const TITLE = 'title';

/** For an admin: name the person who must approve the policy, or go back to the plain title. */
export function ApproverPicker({ policy }: { policy: PolicyDetailResponse }) {
  const t = useTranslations('policies.details');
  const errorMessage = useErrorMessage();
  const { data } = useGetAssigneesQuery();
  const [setApprover, { error }] = useSetPolicyApproverMutation();
  const people = (data?.people ?? []).map((person) => ({ id: person.id, label: person.name }));

  return (
    <div className="w-full text-left">
      <Select
        aria-label={t('approver')}
        options={[{ id: TITLE, label: t('useTitle', { title: policy.approver }) }, ...people]}
        selectedKey={policy.approverPerson?.id ?? TITLE}
        onSelectionChange={(key) =>
          void setApprover({ policyId: policy.id, approverId: key === TITLE ? null : key })
        }
      />
      <p className="mt-1.5 text-caption text-fg-muted">{t('approverHint')}</p>
      {error ? (
        <Alert tone="error" className="mt-1">
          {errorMessage(error)}
        </Alert>
      ) : null}
    </div>
  );
}
