'use client';

import { IconPencil } from '@tabler/icons-react';
import type { BreachResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useUpdateBreachMutation } from '@/lib/api/breaches-api';
import { breachValuesOf } from '@/lib/breach-form';
import { BreachForm } from './breach-form';

/** Changes the details of a breach that is still open. */
export function EditBreachButton({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches');

  return (
    <Modal
      trigger={
        <Button color="secondary" iconLeading={IconPencil}>
          {t('edit')}
        </Button>
      }
      title={t('editTitle')}
      size="lg"
    >
      {(close) => <Editing breach={breach} onDone={close} />}
    </Modal>
  );
}

function Editing({ breach, onDone }: { breach: BreachResponse; onDone: () => void }) {
  const t = useTranslations('breaches.form');
  const [update, { isLoading, error }] = useUpdateBreachMutation();

  return (
    <BreachForm
      initial={breachValuesOf(breach)}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (request) => {
        const result = await update({ id: breach.id, ...request });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
