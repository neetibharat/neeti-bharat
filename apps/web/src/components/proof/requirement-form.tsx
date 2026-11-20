'use client';

import {
  PROOF_DESCRIPTION_MAX_LENGTH,
  PROOF_FREQUENCIES,
  PROOF_TITLE_MAX_LENGTH,
  type SaveProofRequirementRequest,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { DatePicker } from '@/components/base/date-picker/date-picker';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import { TemplateTextarea } from './template-textarea';

export const NEW_REQUIREMENT: SaveProofRequirementRequest = {
  title: '',
  description: '',
  frequency: 'yearly',
  assigneeId: null,
  dueDate: null,
};

export interface RequirementFormProps {
  initial: SaveProofRequirementRequest;
  submitLabel: string;
  isSaving: boolean;
  error?: unknown;
  onSubmit: (values: SaveProofRequirementRequest) => void;
  onCancel: () => void;
}

function OwnerAndDue(props: {
  values: SaveProofRequirementRequest;
  onChange: (change: Partial<SaveProofRequirementRequest>) => void;
}) {
  const t = useTranslations('frameworks.proof.form');
  const { values, onChange } = props;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AssigneeSelect
        label={t('assignee')}
        noneLabel={t('controlOwner')}
        value={values.assigneeId}
        onChange={(assigneeId) => onChange({ assigneeId })}
      />
      <DatePicker
        label={t('dueDate')}
        clearLabel={t('clearDate')}
        openLabel={t('openCalendar')}
        value={values.dueDate}
        onChange={(dueDate) => onChange({ dueDate })}
      />
    </div>
  );
}

function Fields(props: {
  values: SaveProofRequirementRequest;
  onChange: (change: Partial<SaveProofRequirementRequest>) => void;
}) {
  const t = useTranslations('frameworks.proof.form');
  const { values, onChange } = props;

  return (
    <>
      <Input
        label={t('title')}
        value={values.title}
        onChange={(title) => onChange({ title })}
        maxLength={PROOF_TITLE_MAX_LENGTH}
        autoFocus
      />
      <TemplateTextarea
        label={t('description')}
        hint={t('descriptionHint')}
        value={values.description}
        onChange={(description) => onChange({ description })}
        maxLength={PROOF_DESCRIPTION_MAX_LENGTH}
        rows={5}
      />
      <Select
        label={t('frequency')}
        options={PROOF_FREQUENCIES.map((id) => ({ id, label: t(`frequencies.${id}`) }))}
        selectedKey={values.frequency}
        onSelectionChange={(frequency) => onChange({ frequency })}
      />
      <OwnerAndDue values={values} onChange={onChange} />
    </>
  );
}

/** The fields of a proof requirement, for adding one and for changing one. */
export function RequirementForm(props: RequirementFormProps) {
  const t = useTranslations('frameworks.proof.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit(trimStrings(values));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Fields values={values} onChange={patch} />
      {props.error ? <Alert tone="error">{errorMessage(props.error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={props.submitLabel}
        onCancel={props.onCancel}
        isDisabled={values.title.trim() === ''}
        isLoading={props.isSaving}
      />
    </form>
  );
}
