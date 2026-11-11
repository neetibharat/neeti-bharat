'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useRouter } from '@/i18n/navigation';
import { useCreateFrameworkMutation } from '@/lib/api/framework-edit-api';
import { FrameworkForm, NEW_FRAMEWORK } from './framework-form';

/** Starts a framework of the company's own, and opens it so rules can be added straight away. */
export function AddFrameworkButton() {
  const t = useTranslations('frameworks.add');

  return (
    <Modal
      trigger={
        <Button color="secondary" iconLeading={IconPlus}>
          {t('button')}
        </Button>
      }
      title={t('title')}
      description={t('description')}
    >
      {(close) => <Adding onDone={close} />}
    </Modal>
  );
}

function Adding({ onDone }: { onDone: () => void }) {
  const t = useTranslations('frameworks.form');
  const router = useRouter();
  const [create, { isLoading, error }] = useCreateFrameworkMutation();

  return (
    <FrameworkForm
      initial={NEW_FRAMEWORK}
      submitLabel={t('create')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await create(values);
        if ('error' in result) return;
        onDone();
        router.push(`/frameworks/${encodeURIComponent(result.data.id)}`);
      }}
    />
  );
}
