'use client';

import { IconPencil } from '@tabler/icons-react';
import type { ControlResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useArchiveControlMutation, useSaveControlMutation } from '@/lib/api/control-edit-api';
import { ControlForm } from './control-form';

/** The pencil on a control. It edits the company's own copy, including who owns it, and can archive it. */
export function EditControlButton({ control }: { control: ControlResponse }) {
  const t = useTranslations('frameworks.control');

  return (
    <Modal
      size="lg"
      trigger={
        <Button color="tertiary" isIconOnly iconLeading={IconPencil} aria-label={t('edit')} />
      }
      title={t('edit')}
      description={t('editHint')}
    >
      {(close) => <EditForm control={control} onDone={close} />}
    </Modal>
  );
}

function EditForm({ control, onDone }: { control: ControlResponse; onDone: () => void }) {
  const t = useTranslations('frameworks.control.form');
  const [save, { isLoading, error }] = useSaveControlMutation();

  return (
    <ControlForm
      initial={{
        title: control.title,
        description: control.description,
        assigneeId: control.assignee?.id ?? null,
        reviewDate: control.reviewDate,
        policyIds: control.policies.map((policy) => policy.id),
        ownerRole: control.ownerRole,
      }}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const saved = await save({ id: control.id, ...values, ownerRole: values.ownerRole! });
        if (!('error' in saved)) onDone();
      }}
      extra={<ArchiveButton controlId={control.id} onDone={onDone} />}
    />
  );
}

function ArchiveButton({ controlId, onDone }: { controlId: string; onDone: () => void }) {
  const t = useTranslations('frameworks.control.form');
  const [archive, { isLoading }] = useArchiveControlMutation();

  return (
    <Button
      color="tertiary"
      isLoading={isLoading}
      onPress={async () => {
        const result = await archive(controlId);
        if (!('error' in result)) onDone();
      }}
    >
      {t('archive')}
    </Button>
  );
}
