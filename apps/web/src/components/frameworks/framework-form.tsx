'use client';

import {
  FRAMEWORK_ABOUT_MAX_LENGTH,
  FRAMEWORK_NAME_MAX_LENGTH,
  FRAMEWORK_SEAL_MAX_LENGTH,
  type SaveFrameworkRequest,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';

export const NEW_FRAMEWORK: SaveFrameworkRequest = { name: '', about: '', seal: '' };

export interface FrameworkFormProps {
  initial: SaveFrameworkRequest;
  submitLabel: string;
  isSaving: boolean;
  error?: unknown;
  onSubmit: (values: SaveFrameworkRequest) => void;
  onCancel: () => void;
}

function Fields(props: {
  values: SaveFrameworkRequest;
  onChange: (change: Partial<SaveFrameworkRequest>) => void;
}) {
  const t = useTranslations('frameworks.form');
  const { values } = props;
  const set = props.onChange;

  return (
    <>
      <Input
        label={t('name')}
        value={values.name}
        onChange={(name) => set({ name })}
        maxLength={FRAMEWORK_NAME_MAX_LENGTH}
        autoFocus
      />
      <Input
        label={t('about')}
        hint={t('aboutHint')}
        value={values.about}
        onChange={(about) => set({ about })}
        maxLength={FRAMEWORK_ABOUT_MAX_LENGTH}
      />
      <Input
        label={t('seal')}
        hint={t('sealHint')}
        value={values.seal}
        onChange={(seal) => set({ seal })}
        maxLength={FRAMEWORK_SEAL_MAX_LENGTH}
        className="w-40"
      />
    </>
  );
}

/** The fields of a framework of the company's own, for adding one and for changing one. */
export function FrameworkForm(props: FrameworkFormProps) {
  const t = useTranslations('frameworks.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);
  const canSave = values.name.trim() !== '' && values.seal.trim() !== '';

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit(trimStrings(values));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Fields values={values} onChange={patch} />
      {props.error ? <Alert tone="error">{errorMessage(props.error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={props.submitLabel}
        onCancel={props.onCancel}
        isDisabled={!canSave}
        isLoading={props.isSaving}
      />
    </form>
  );
}
