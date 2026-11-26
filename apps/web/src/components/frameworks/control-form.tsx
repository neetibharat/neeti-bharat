'use client';

import {
  CONTROL_DESCRIPTION_MAX_LENGTH,
  CONTROL_TITLE_MAX_LENGTH,
  JOB_ROLES,
  policyLabel,
  type ControlDetailsRequest,
  type JobRole,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent, ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { DatePicker } from '@/components/base/date-picker/date-picker';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { Textarea } from '@/components/base/textarea/textarea';
import { useGetPoliciesQuery } from '@/lib/api/frameworks-api';
import { trimStrings } from '@/lib/form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';
import { AssigneeSelect } from './assignee-select';

/** The details of a control. `ownerRole` is there when editing one, and left out when adding one. */
export type ControlFormValues = ControlDetailsRequest & { ownerRole?: JobRole };

export interface ControlFormProps {
  initial: ControlFormValues;
  submitLabel: string;
  isSaving: boolean;
  error?: unknown;
  onSubmit: (values: ControlFormValues) => void;
  onCancel: () => void;
  /** Shown on the left of the buttons, such as "Archive". */
  extra?: ReactNode;
}

/** The fields of a control, for adding one and for editing one. */
export function ControlForm(props: ControlFormProps) {
  const t = useTranslations('frameworks.control.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);
  const canSave = values.title.trim() !== '' && values.description.trim() !== '';

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
  values: ControlFormValues;
  onChange: (change: Partial<ControlFormValues>) => void;
}

/** Who looks after the control, and when it is next reviewed. */
function PersonAndDate({ values, onChange }: FieldsProps) {
  const t = useTranslations('frameworks.control.form');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AssigneeSelect
        label={t('assignee')}
        noneLabel={t('nobody')}
        value={values.assigneeId}
        onChange={(assigneeId) => onChange({ assigneeId })}
      />
      <DatePicker
        label={t('reviewDate')}
        clearLabel={t('clearDate')}
        openLabel={t('openCalendar')}
        value={values.reviewDate}
        onChange={(reviewDate) => onChange({ reviewDate })}
      />
    </div>
  );
}

function Fields({ values, onChange }: FieldsProps) {
  const t = useTranslations('frameworks.control.form');

  return (
    <>
      <Input
        label={t('title')}
        value={values.title}
        onChange={(title) => onChange({ title })}
        maxLength={CONTROL_TITLE_MAX_LENGTH}
        autoFocus
      />
      <Textarea
        label={t('description')}
        value={values.description}
        onChange={(description) => onChange({ description })}
        maxLength={CONTROL_DESCRIPTION_MAX_LENGTH}
        rows={3}
      />
      <PersonAndDate values={values} onChange={onChange} />
      <PolicyChoices
        selected={values.policyIds}
        onChange={(policyIds) => onChange({ policyIds })}
      />
      {values.ownerRole && (
        <OwnerRoleField
          value={values.ownerRole}
          onChange={(ownerRole) => onChange({ ownerRole })}
        />
      )}
    </>
  );
}

/** The policies that cover the control. One added later goes last, so the primary one never changes by accident. */
function PolicyChoices(props: { selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useTranslations('frameworks.control.form');
  const { data } = useGetPoliciesQuery();
  const toggle = (id: string, isOn: boolean) =>
    props.onChange(
      isOn ? [...props.selected, id] : props.selected.filter((current) => current !== id),
    );

  return (
    <fieldset>
      <legend className="text-label font-semibold text-fg">{t('policies')}</legend>
      <div className="mt-2 grid max-h-44 gap-1.5 overflow-y-auto rounded-control border border-line p-3">
        {(data?.policies ?? []).map((policy) => (
          <Checkbox
            key={policy.id}
            isSelected={props.selected.includes(policy.id)}
            onChange={(isOn) => toggle(policy.id, isOn)}
          >
            <span className="text-label">{policyLabel(policy)}</span>
          </Checkbox>
        ))}
      </div>
    </fieldset>
  );
}

/** The job accountable for the control when no one person is named. It starts as its main policy's owner. */
function OwnerRoleField(props: { value: JobRole; onChange: (role: JobRole) => void }) {
  const t = useTranslations('frameworks.control.form');
  const tJobs = useTranslations('jobRoles');

  return (
    <div>
      <Select
        label={t('ownerRole')}
        options={JOB_ROLES.map((role) => ({ id: role, label: tJobs(role) }))}
        selectedKey={props.value}
        onSelectionChange={props.onChange}
      />
      <p className="mt-1.5 text-caption text-fg-muted">{t('ownerRoleHint')}</p>
    </div>
  );
}
