'use client';

import { IconPencil } from '@tabler/icons-react';
import { isValidProfileValue, type ProfileEntryResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { Modal } from '@/components/base/modal/modal';
import { Select } from '@/components/base/select/select';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useEntryText } from './use-entry-text';
import { useSaveEntry } from './use-save-entry';

/** The pencil on a row. One dialog does the whole edit, including the confirmation a legal limit needs. */
export function EditEntryButton({ entry }: { entry: ProfileEntryResponse }) {
  const t = useTranslations('profile');
  const text = useEntryText();
  return (
    <Modal
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconPencil}
          aria-label={t('editEntry')}
        />
      }
      title={text.label(entry)}
      description={text.hint(entry)}
    >
      {(close) => <EditEntryForm entry={entry} onDone={close} />}
    </Modal>
  );
}

function EditEntryForm({ entry, onDone }: { entry: ProfileEntryResponse; onDone: () => void }) {
  const t = useTranslations('profile');
  const errorMessage = useErrorMessage();
  const { save, isSaving, error } = useSaveEntry(entry.key);
  const [draft, setDraft] = useState(entry.value);
  const [confirmed, setConfirmed] = useState(false);

  const invalid = !isValidProfileValue(entry.kind, draft);
  const needsConfirmation = entry.requiresConfirmation;
  const canSave = !invalid && draft !== entry.value && (!needsConfirmation || confirmed);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await save(draft, needsConfirmation ? true : undefined)) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <AnswerInput
        kind={entry.kind}
        value={draft}
        onChange={setDraft}
        error={invalid ? errorMessage({ code: 'VALIDATION_FAILED' }) : undefined}
      />
      {needsConfirmation && <LegalConfirmation confirmed={confirmed} onChange={setConfirmed} />}
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={onDone}>
          {t('cancel')}
        </Button>
        <Button type="submit" isDisabled={!canSave} isLoading={isSaving}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}

interface AnswerInputProps {
  kind: ProfileEntryResponse['kind'];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** A yes/no answer is picked from a list; everything else is typed. */
function AnswerInput({ kind, value, onChange, error }: AnswerInputProps) {
  const t = useTranslations('profile');
  if (kind === 'yesNo') {
    const options = [
      { id: 'yes', label: t('yes') },
      { id: 'no', label: t('no') },
    ];
    return (
      <Select
        aria-label={t('columns.answer')}
        options={options}
        selectedKey={value}
        onSelectionChange={onChange}
      />
    );
  }
  return (
    <Input
      aria-label={t('columns.answer')}
      value={value}
      onChange={onChange}
      error={error}
      autoFocus
    />
  );
}

function LegalConfirmation(props: { confirmed: boolean; onChange: (value: boolean) => void }) {
  const t = useTranslations('profile');
  return (
    <div className="flex flex-col gap-3">
      <Alert tone="info">{t('confirm.body')}</Alert>
      <Checkbox isSelected={props.confirmed} onChange={props.onChange}>
        {t('legalConfirm')}
      </Checkbox>
    </div>
  );
}
