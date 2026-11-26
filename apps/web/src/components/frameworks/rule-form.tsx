'use client';

import {
  REQUIREMENT_REFERENCE_MAX_LENGTH,
  REQUIREMENT_SUMMARY_MAX_LENGTH,
  REQUIREMENT_TITLE_MAX_LENGTH,
  type SaveRequirementRequest,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Textarea } from '@/components/base/textarea/textarea';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';

export const NEW_RULE: SaveRequirementRequest = { reference: '', title: '', summary: '' };

export interface RuleFormProps {
  initial: SaveRequirementRequest;
  submitLabel: string;
  isSaving: boolean;
  error?: unknown;
  onSubmit: (values: SaveRequirementRequest) => void;
  onCancel: () => void;
}

function Fields(props: {
  values: SaveRequirementRequest;
  onChange: (change: Partial<SaveRequirementRequest>) => void;
}) {
  const t = useTranslations('frameworks.ruleForm');
  const { values } = props;
  const set = props.onChange;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <Input
          label={t('reference')}
          hint={t('referenceHint')}
          value={values.reference}
          onChange={(reference) => set({ reference })}
          maxLength={REQUIREMENT_REFERENCE_MAX_LENGTH}
          autoFocus
        />
        <Input
          label={t('title')}
          value={values.title}
          onChange={(title) => set({ title })}
          maxLength={REQUIREMENT_TITLE_MAX_LENGTH}
        />
      </div>
      <Textarea
        label={t('summary')}
        value={values.summary}
        onChange={(summary) => set({ summary })}
        maxLength={REQUIREMENT_SUMMARY_MAX_LENGTH}
        rows={3}
      />
    </>
  );
}

/** The fields of a rule in a framework of the company's own, for adding one and for changing one. */
export function RuleForm(props: RuleFormProps) {
  const t = useTranslations('frameworks.ruleForm');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);
  const canSave = values.reference.trim() !== '' && values.title.trim() !== '';

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
