'use client';

import { IconPencil } from '@tabler/icons-react';
import type { PolicyDetailResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useCan } from '@/components/providers/user-provider';
import { useRouter } from '@/i18n/navigation';
import { useArchivePolicyMutation, useSavePolicyDetailsMutation } from '@/lib/api/policy-edit-api';
import { PolicyForm } from './policy-form';

/** Changes a policy's title, summary, owner and approver title, and can archive it. */
export function EditPolicyButton({ policy }: { policy: PolicyDetailResponse }) {
  const { canEdit } = useCan();
  const t = useTranslations('policies.edit');
  if (!canEdit) return null;

  return (
    <Modal
      size="lg"
      trigger={
        <Button color="secondary" iconLeading={IconPencil}>
          {t('button')}
        </Button>
      }
      title={t('title')}
      description={t('hint')}
    >
      {(close) => <EditForm policy={policy} onDone={close} />}
    </Modal>
  );
}

function EditForm({ policy, onDone }: { policy: PolicyDetailResponse; onDone: () => void }) {
  const t = useTranslations('policies.form');
  const [save, { isLoading, error }] = useSavePolicyDetailsMutation();

  return (
    <PolicyForm
      initial={{
        title: policy.title,
        summary: policy.summary,
        ownerRole: policy.ownerRole,
        approverTitle: policy.approver,
      }}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const saved = await save({ policyId: policy.id, ...values });
        if (!('error' in saved)) onDone();
      }}
      extra={<ArchiveButton policyId={policy.id} />}
    />
  );
}

function ArchiveButton({ policyId }: { policyId: string }) {
  const t = useTranslations('policies.form');
  const router = useRouter();
  const [archive, { isLoading }] = useArchivePolicyMutation();

  return (
    <Button
      color="tertiary"
      isLoading={isLoading}
      onPress={async () => {
        const result = await archive(policyId);
        if (!('error' in result)) router.push('/policies');
      }}
    >
      {t('archive')}
    </Button>
  );
}
