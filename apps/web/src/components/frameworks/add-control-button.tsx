'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useCreateControlMutation } from '@/lib/api/control-edit-api';
import { ControlForm } from './control-form';

const EMPTY = { title: '', description: '', assigneeId: null, reviewDate: null, policyIds: [] };

/** Adds a control of the company's own under a rule. */
export function AddControlButton(props: {
  requirementId: string;
  color?: 'secondary' | 'tertiary';
}) {
  const { requirementId, color = 'tertiary' } = props;
  const t = useTranslations('frameworks.control');

  return (
    <Modal
      size="lg"
      trigger={
        <Button color={color} size={color === 'tertiary' ? 'sm' : undefined} iconLeading={IconPlus}>
          {t('add')}
        </Button>
      }
      title={t('add')}
      description={t('addHint')}
    >
      {(close) => <AddForm requirementId={requirementId} onDone={close} />}
    </Modal>
  );
}

function AddForm({ requirementId, onDone }: { requirementId: string; onDone: () => void }) {
  const t = useTranslations('frameworks.control.form');
  const [create, { isLoading, error }] = useCreateControlMutation();

  return (
    <ControlForm
      initial={EMPTY}
      submitLabel={t('create')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await create({ requirementId, ...values });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
