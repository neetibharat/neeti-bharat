'use client';

import type { AppRole } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';
import { AccessSelect } from './access-select';

export interface PersonValues {
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  access: AppRole;
}

export interface PersonFormProps {
  initial: PersonValues;
  /** Editing keeps the email and access as they are: they are changed elsewhere. */
  isEditing?: boolean;
  isSaving: boolean;
  error: unknown;
  submitLabel: string;
  onSubmit: (values: PersonValues) => void;
  onCancel: () => void;
}

/** The form for adding a person or editing their details. */
export function PersonForm({
  initial,
  isEditing,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: PersonFormProps) {
  const t = useTranslations('people.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(initial);
  const canSave = values.name.trim() !== '' && (isEditing || values.email.trim() !== '');

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(trimStrings(values));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <PersonFields values={values} onChange={patch} isEditing={isEditing} />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={submitLabel}
        onCancel={onCancel}
        isDisabled={!canSave}
        isLoading={isSaving}
      />
    </form>
  );
}

interface PersonFieldsProps {
  values: PersonValues;
  onChange: (change: Partial<PersonValues>) => void;
  isEditing?: boolean;
}

function PersonFields({ values, onChange, isEditing }: PersonFieldsProps) {
  const t = useTranslations('people.form');
  const set =
    <K extends keyof PersonValues>(key: K) =>
    (value: PersonValues[K]) =>
      onChange({ [key]: value });

  return (
    <>
      <Input label={t('name')} value={values.name} onChange={set('name')} isRequired autoFocus />
      {!isEditing && (
        <Input
          type="email"
          label={t('email')}
          value={values.email}
          onChange={set('email')}
          isRequired
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('department')} value={values.department} onChange={set('department')} />
        <Input label={t('jobTitle')} value={values.jobTitle} onChange={set('jobTitle')} />
      </div>
      {!isEditing && (
        <div className="flex flex-col gap-1.5">
          <AccessSelect label={t('access')} value={values.access} onChange={set('access')} />
          <p className="text-caption text-fg-subtle">{t('accessHint')}</p>
        </div>
      )}
    </>
  );
}
