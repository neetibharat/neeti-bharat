'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { NEW_REQUIREMENT, RequirementForm } from '@/components/proof/requirement-form';
import { useCreateRequirementMutation } from '@/lib/api/evidence-api';

/** Adds something this control needs proof of, which a company can do for its own controls and built-in ones. */
export function AddRequirementButton({ controlId }: { controlId: string }) {
  const t = useTranslations('frameworks.proof');

  return (
    <Modal
      trigger={
        <Button color="secondary" iconLeading={IconPlus}>
          {t('addRequirement')}
        </Button>
      }
      title={t('addRequirement')}
      size="lg"
    >
      {(close) => <Adding controlId={controlId} onDone={close} />}
    </Modal>
  );
}

function Adding({ controlId, onDone }: { controlId: string; onDone: () => void }) {
  const t = useTranslations('frameworks.proof.form');
  const [create, { isLoading, error }] = useCreateRequirementMutation();

  return (
    <RequirementForm
      initial={NEW_REQUIREMENT}
      submitLabel={t('create')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await create({ controlId, ...values });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
