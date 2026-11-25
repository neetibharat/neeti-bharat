'use client';

import {
  TRAINING_ABOUT_MAX_LENGTH,
  TRAINING_NAME_MAX_LENGTH,
  TRAINING_URL_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Textarea } from '@/components/base/textarea/textarea';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';
import { canSaveTraining, type TrainingValues } from '@/lib/training';

export interface TrainingFormProps {
  initial: TrainingValues;
  submitLabel: string;
  isSaving: boolean;
  error: unknown;
  onSubmit: (values: TrainingValues) => void;
  onCancel: () => void;
}

interface FieldsProps {
  values: TrainingValues;
  onChange: (change: Partial<TrainingValues>) => void;
}

/** Whether the training comes round again each year. */
function RepeatsField({ values, onChange }: FieldsProps) {
  const t = useTranslations('training.form');

  return (
    <Checkbox
      isSelected={values.repeatsYearly}
      onChange={(repeatsYearly) => onChange({ repeatsYearly })}
    >
      <span className="flex flex-col">
        <span>{t('repeats')}</span>
        <span className="text-caption text-fg-muted">{t('repeatsHint')}</span>
      </span>
    </Checkbox>
  );
}

/** The boxes of the form. */
function Fields({ values, onChange }: FieldsProps) {
  const t = useTranslations('training.form');

  return (
    <>
      <Input
        label={t('name')}
        value={values.name}
        onChange={(name) => onChange({ name })}
        maxLength={TRAINING_NAME_MAX_LENGTH}
        isRequired
        autoFocus
      />
      <Textarea
        label={t('about')}
        hint={t('aboutHint')}
        value={values.about}
        onChange={(about) => onChange({ about })}
        maxLength={TRAINING_ABOUT_MAX_LENGTH}
        rows={2}
      />
      <Input
        type="url"
        label={t('url')}
        hint={t('urlHint')}
        placeholder="https://"
        value={values.url}
        onChange={(url) => onChange({ url })}
        maxLength={TRAINING_URL_MAX_LENGTH}
      />
      <RepeatsField values={values} onChange={onChange} />
    </>
  );
}

/** A training: its name, what it teaches, and where to take it. */
export function TrainingForm(props: TrainingFormProps) {
  const t = useTranslations('training.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit(values);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Fields values={values} onChange={patch} />
      {props.error ? <Alert tone="error">{errorMessage(props.error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={props.submitLabel}
        onCancel={props.onCancel}
        isDisabled={!canSaveTraining(values)}
        isLoading={props.isSaving}
      />
    </form>
  );
}
