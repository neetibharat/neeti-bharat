'use client';

import {
  JOB_ROLES,
  POLICY_APPROVER_TITLE_MAX_LENGTH,
  POLICY_SUMMARY_MAX_LENGTH,
  POLICY_TITLE_MAX_LENGTH,
  type JobRole,
  type SavePolicyRequest,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent, ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { Textarea } from '@/components/base/textarea/textarea';
import { useGetFrameworksQuery } from '@/lib/api/frameworks-api';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';

/** The details of a policy. `frameworkId` is there when adding one, and left out when editing one. */
export type PolicyFormValues = SavePolicyRequest & { frameworkId?: string };

export interface PolicyFormProps {
  initial: PolicyFormValues;
  submitLabel: string;
  isSaving: boolean;
  error?: unknown;
  onSubmit: (values: PolicyFormValues) => void;
  onCancel: () => void;
  /** Shown on the left of the buttons, such as "Archive". */
  extra?: ReactNode;
}

/** The fields of a policy, for adding one and for editing one. */
export function PolicyForm(props: PolicyFormProps) {
  const t = useTranslations('policies.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);
  const canSave =
    values.title.trim() !== '' &&
    values.summary.trim() !== '' &&
    values.approverTitle.trim() !== '' &&
    (props.initial.frameworkId === undefined || Boolean(values.frameworkId));

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
        extra={props.extra}
      />
    </form>
  );
}

interface FieldsProps {
  values: PolicyFormValues;
  onChange: (change: Partial<PolicyFormValues>) => void;
}

function Fields({ values, onChange }: FieldsProps) {
  const t = useTranslations('policies.form');

  return (
    <>
      <Input
        label={t('title')}
        value={values.title}
        onChange={(title) => onChange({ title })}
        maxLength={POLICY_TITLE_MAX_LENGTH}
        autoFocus
      />
      <Textarea
        label={t('summary')}
        value={values.summary}
        onChange={(summary) => onChange({ summary })}
        maxLength={POLICY_SUMMARY_MAX_LENGTH}
        rows={6}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <OwnerField value={values.ownerRole} onChange={(ownerRole) => onChange({ ownerRole })} />
        <Input
          label={t('approverTitle')}
          value={values.approverTitle}
          onChange={(approverTitle) => onChange({ approverTitle })}
          maxLength={POLICY_APPROVER_TITLE_MAX_LENGTH}
        />
      </div>
      {values.frameworkId !== undefined && (
        <FrameworkField
          value={values.frameworkId}
          onChange={(frameworkId) => onChange({ frameworkId })}
        />
      )}
    </>
  );
}

function OwnerField(props: { value: JobRole; onChange: (role: JobRole) => void }) {
  const t = useTranslations('policies.form');
  const tJobs = useTranslations('jobRoles');

  return (
    <Select
      label={t('owner')}
      options={JOB_ROLES.map((role) => ({ id: role, label: tJobs(role) }))}
      selectedKey={props.value}
      onSelectionChange={props.onChange}
    />
  );
}

/** The framework a new policy sits under. It can still cover controls in any framework. */
function FrameworkField(props: { value: string; onChange: (id: string) => void }) {
  const t = useTranslations('policies.form');
  const { data } = useGetFrameworksQuery();
  const options = (data?.frameworks ?? []).map(({ id, name }) => ({ id, label: name }));

  return (
    <div>
      <Select
        label={t('framework')}
        options={options}
        selectedKey={props.value || null}
        onSelectionChange={props.onChange}
      />
      <p className="mt-1.5 text-caption text-fg-muted">{t('frameworkHint')}</p>
    </div>
  );
}
