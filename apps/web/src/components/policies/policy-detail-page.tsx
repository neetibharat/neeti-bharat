'use client';

import { IconChevronLeft, IconInfoCircle } from '@tabler/icons-react';
import { policyLabel, type PolicyDetailResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Tabs } from '@/components/base/tabs/tabs';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Link } from '@/i18n/navigation';
import { useGetPolicyQuery } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { CoveredControls } from './covered-controls';
import { EditPolicyButton } from './edit-policy-button';
import { PolicyActions } from './policy-actions';
import { PolicyApprovalCard } from './policy-approval-card';
import { PolicyDocumentCard } from './policy-document-card';
import { PolicyProof } from './policy-proof';
import { PolicyProperties } from './policy-properties';

function BackLink() {
  const t = useTranslations('policies');
  return (
    <Link
      href="/policies"
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

/** One policy: what it is, who owns and approves it, its text, the proof to keep, and the controls it covers. */
export function PolicyDetailPage({ policyId }: { policyId: string }) {
  const errorMessage = useErrorMessage();
  const { data: policy, error } = useGetPolicyQuery(policyId);

  if (error) {
    return (
      <>
        <BackLink />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!policy) return null;

  return (
    <>
      <BackLink />
      <PageHeader
        title={policyLabel(policy)}
        description={policy.summary}
        actions={<Actions policy={policy} />}
      />
      <PolicyBody policy={policy} />
    </>
  );
}

/** Edit the details, and the moves open to this person. */
function Actions({ policy }: { policy: PolicyDetailResponse }) {
  return (
    <div className="flex items-start gap-2">
      <EditPolicyButton policy={policy} />
      <PolicyActions policyId={policy.id} status={policy.status} canDecide={policy.canDecide} />
    </div>
  );
}

function PolicyBody({ policy }: { policy: PolicyDetailResponse }) {
  const t = useTranslations('policies');
  const tabs = [
    {
      id: 'text',
      label: t('tabs.text'),
      content: <PolicyDocumentCard policy={policy} />,
    },
    { id: 'approval', label: t('tabs.approval'), content: <PolicyApprovalCard state={policy} /> },
    { id: 'coverage', label: t('tabs.coverage'), content: <Coverage policy={policy} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 text-caption text-fg-muted">
        <IconInfoCircle className="mt-px size-4 shrink-0" />
        {t('reviewNote')}
      </p>
      <Tabs tabs={tabs} aside={<PolicyProperties policy={policy} />} />
    </div>
  );
}

/** What the policy needs kept as proof, and the controls it answers. */
function Coverage({ policy }: { policy: PolicyDetailResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <PolicyProof policyId={policy.id} />
      <CoveredControls policyId={policy.id} />
    </div>
  );
}
