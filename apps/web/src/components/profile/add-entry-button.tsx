'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Modal } from '@/components/base/modal/modal';
import { useAddProfileEntryMutation } from '@/lib/api/profile-api';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';

/** "Add entry": opens a small form for an answer of your own, such as an office address. */
export function AddEntryButton() {
  const t = useTranslations('profile');
  return (
    <Modal
      trigger={
        <Button color="secondary" iconLeading={IconPlus}>
          {t('addEntry')}
        </Button>
      }
      title={t('addTitle')}
      description={t('addDescription')}
    >
      {(close) => <AddEntryForm onDone={close} />}
    </Modal>
  );
}

function AddEntryForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('profile');
  const errorMessage = useErrorMessage();
  const [add, { isLoading, error }] = useAddProfileEntryMutation();
  const [draft, patch] = useFormDraft({ label: '', value: '' });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await add(trimStrings(draft));
    if (!('error' in result)) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label={t('labelLabel')}
        value={draft.label}
        onChange={(label) => patch({ label })}
        isRequired
        autoFocus
      />
      <Input label={t('valueLabel')} value={draft.value} onChange={(value) => patch({ value })} />
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={t('add')}
        onCancel={onDone}
        isLoading={isLoading}
      />
    </form>
  );
}
