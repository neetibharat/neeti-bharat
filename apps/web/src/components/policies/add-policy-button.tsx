'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useCan } from '@/components/providers/user-provider';
import { useGetFrameworksQuery } from '@/lib/api/frameworks-api';
import { useCreatePolicyMutation } from '@/lib/api/policy-edit-api';
import { useRouter } from '@/i18n/navigation';
import { PolicyForm } from './policy-form';

/** Adds a policy of the company's own, as a draft, and opens it so the text can be written. */
export function AddPolicyButton() {
  const { canEdit } = useCan();
  const t = useTranslations('policies.add');
  if (!canEdit) return null;

  return (
    <Modal
      size="lg"
      trigger={
        <Button color="secondary" iconLeading={IconPlus}>
          {t('button')}
        </Button>
      }
      title={t('title')}
      description={t('hint')}
    >
      {(close) => <AddForm onDone={close} />}
    </Modal>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('policies.form');
  const router = useRouter();
  const { data } = useGetFrameworksQuery();
  const [create, { isLoading, error }] = useCreatePolicyMutation();
  if (!data) return null;

  return (
    <PolicyForm
      initial={{
        title: '',
        summary: '',
        ownerRole: 'DPO',
        approverTitle: '',
        frameworkId: data.frameworks[0]?.id ?? '',
      }}
      submitLabel={t('create')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await create({ ...values, frameworkId: values.frameworkId! });
        if ('error' in result) return;
        onDone();
        router.push(`/policies/${result.data.id}`);
      }}
    />
  );
}
