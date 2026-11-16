'use client';

import type { PolicyStatus } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useChangePolicyStatusMutation } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RequestApprovalButton } from './request-approval-button';

export interface PolicyActionsProps {
  policyId: string;
  status: PolicyStatus;
  /** Whether this person may approve, send back or reopen: the named approver, or an admin when none is named. */
  canDecide: boolean;
}

/** The moves open to this person: anyone who can edit may ask for approval; the approver decides. */
export function PolicyActions({ policyId, status, canDecide }: PolicyActionsProps) {
  const { canEdit } = useCan();
  const t = useTranslations('policies.actions');
  const errorMessage = useErrorMessage();
  const [change, { isLoading, error }] = useChangePolicyStatusMutation();
  const move = (to: PolicyStatus) => void change({ policyId, status: to });

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status === 'draft' && canEdit && <RequestApprovalButton policyId={policyId} />}
        {status === 'in_review' && canDecide && (
          <>
            <Button color="secondary" isDisabled={isLoading} onPress={() => move('draft')}>
              {t('sendBack')}
            </Button>
            <Button isLoading={isLoading} onPress={() => move('approved')}>
              {t('approve')}
            </Button>
          </>
        )}
        {status === 'approved' && canDecide && (
          <Button color="secondary" isLoading={isLoading} onPress={() => move('draft')}>
            {t('reopen')}
          </Button>
        )}
      </div>
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
    </div>
  );
}
