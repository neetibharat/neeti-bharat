'use client';

import type { PolicyApprovalResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useGetPolicyVersionQuery } from '@/lib/api/policy-edit-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useResolvedDocument } from './policy-document-card';
import { PolicyReader } from './policy-editor';

/** Opens the text of an approved version, as it was approved. */
export function PolicyVersionButton({
  policyId,
  version,
}: {
  policyId: string;
  version: PolicyApprovalResponse;
}) {
  const t = useTranslations('policies.approval');

  return (
    <Modal
      size="lg"
      trigger={
        <Button color="tertiary" size="sm">
          {t('view')}
        </Button>
      }
      title={t('versionTitle', { version: version.version })}
      description={version.changelog ?? undefined}
    >
      {() => <VersionText policyId={policyId} version={version.version} />}
    </Modal>
  );
}

function VersionText({ policyId, version }: { policyId: string; version: number }) {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetPolicyVersionQuery({ policyId, version });
  const resolved = useResolvedDocument(
    data?.content ?? { type: 'doc', content: [] },
    data?.values ?? {},
  );
  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return null;

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <PolicyReader document={resolved} />
    </div>
  );
}
