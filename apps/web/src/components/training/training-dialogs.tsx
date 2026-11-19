'use client';

import { IconPencil, IconPlus } from '@tabler/icons-react';
import type { TrainingResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useAddTrainingMutation, useUpdateTrainingMutation } from '@/lib/api/training-api';
import {
  NEW_TRAINING,
  toAddTrainingRequest,
  toTrainingValues,
  toUpdateTrainingRequest,
} from '@/lib/training';
import { TrainingForm } from './training-form';

/** Adds a training in a short form. */
export function AddTrainingButton() {
  const t = useTranslations('training');
  return (
    <Modal
      trigger={<Button iconLeading={IconPlus}>{t('add')}</Button>}
      title={t('add')}
      description={t('addHint')}
    >
      {(close) => <AddForm onDone={close} />}
    </Modal>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('training.form');
  const [add, { isLoading, error }] = useAddTrainingMutation();

  return (
    <TrainingForm
      initial={NEW_TRAINING}
      isSaving={isLoading}
      error={error}
      submitLabel={t('add')}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await add(toAddTrainingRequest(values));
        if (!('error' in result)) onDone();
      }}
    />
  );
}

/** Changes a training that is in use. */
export function EditTrainingButton({ training }: { training: TrainingResponse }) {
  const t = useTranslations('training');
  return (
    <Modal
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconPencil}
          aria-label={t('edit', { name: training.name })}
        />
      }
      title={t('editTitle')}
    >
      {(close) => <EditForm training={training} onDone={close} />}
    </Modal>
  );
}

function EditForm({ training, onDone }: { training: TrainingResponse; onDone: () => void }) {
  const t = useTranslations('training.form');
  const [update, { isLoading, error }] = useUpdateTrainingMutation();

  return (
    <TrainingForm
      initial={toTrainingValues(training)}
      isSaving={isLoading}
      error={error}
      submitLabel={t('save')}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await update({ id: training.id, ...toUpdateTrainingRequest(values) });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
