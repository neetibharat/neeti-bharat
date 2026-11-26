'use client';

import {
  REQUEST_EMAIL_MAX_LENGTH,
  REQUEST_FORM_SOURCES,
  REQUEST_NAME_MAX_LENGTH,
  REQUEST_TEXT_MAX_LENGTH,
  REQUEST_TYPES,
  type CreateRequestRequest,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { DatePicker } from '@/components/base/date-picker/date-picker';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { Textarea } from '@/components/base/textarea/textarea';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';
import { toCreateRequest, toUpdateRequest, type RequestValues } from '@/lib/request-form';

export interface RequestFormProps {
  initial: RequestValues;
  /** Logging a new request also asks where it came from and when it was received. */
  isNew: boolean;
  isSaving: boolean;
  error: unknown;
  submitLabel: string;
  /** An edit sends the four details only: an update request fits where a create request is expected. */
  onSubmit: (request: CreateRequestRequest) => void;
  onCancel: () => void;
}

/** The form for logging a request or editing its details. */
export function RequestForm(props: RequestFormProps) {
  const { initial, isNew, isSaving, error, submitLabel, onSubmit, onCancel } = props;
  const t = useTranslations('requests.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(initial);
  const request = isNew ? toCreateRequest(values) : toUpdateRequest(values);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (request) onSubmit(request);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <PersonFields values={values} onChange={patch} />
      {isNew && <ReceivedFields values={values} onChange={patch} />}
      <Textarea
        label={t('details')}
        hint={t('detailsHint')}
        value={values.details}
        onChange={(details) => patch({ details })}
        maxLength={REQUEST_TEXT_MAX_LENGTH}
        isRequired
      />
      <Assignee values={values} onChange={patch} />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={submitLabel}
        onCancel={onCancel}
        isDisabled={!request}
        isLoading={isSaving}
      />
    </form>
  );
}

interface FieldsProps {
  values: RequestValues;
  onChange: (change: Partial<RequestValues>) => void;
}

/** What is asked for, and who asks. */
function PersonFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('requests.form');
  const tTypes = useTranslations('requests.types');

  return (
    <>
      <Select
        label={t('type')}
        options={REQUEST_TYPES.map((id) => ({ id, label: tTypes(id) }))}
        selectedKey={values.type}
        onSelectionChange={(type) => onChange({ type })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('personName')}
          value={values.personName}
          onChange={(personName) => onChange({ personName })}
          maxLength={REQUEST_NAME_MAX_LENGTH}
          isRequired
          autoFocus
        />
        <Input
          type="email"
          label={t('personEmail')}
          value={values.personEmail}
          onChange={(personEmail) => onChange({ personEmail })}
          maxLength={REQUEST_EMAIL_MAX_LENGTH}
          isRequired
        />
      </div>
    </>
  );
}

/** Who deals with it. Nobody means the DPO. */
function Assignee({ values, onChange }: FieldsProps) {
  const t = useTranslations('requests.form');

  return (
    <div className="flex flex-col gap-1.5">
      <AssigneeSelect
        label={t('assignee')}
        noneLabel={t('assigneeNone')}
        value={values.assigneeId}
        onChange={(assigneeId) => onChange({ assigneeId })}
      />
      <p className="text-caption text-fg-subtle">{t('assigneeHint')}</p>
    </div>
  );
}

/** Where the request came from, and the day and time it was received. The due date counts from here. */
function ReceivedFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('requests.form');
  const tSources = useTranslations('requests.sources');

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        label={t('source')}
        options={REQUEST_FORM_SOURCES.map((id) => ({ id, label: tSources(id) }))}
        selectedKey={values.source}
        onSelectionChange={(source) => onChange({ source })}
      />
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <DatePicker
          label={t('receivedDate')}
          value={values.receivedDate}
          onChange={(receivedDate) => onChange({ receivedDate })}
          clearLabel={t('clearDate')}
          openLabel={t('openCalendar')}
        />
        <Input
          type="time"
          label={t('receivedTime')}
          value={values.receivedTime}
          onChange={(receivedTime) => onChange({ receivedTime })}
          isRequired
        />
      </div>
      <p className="text-caption text-fg-subtle">{t('receivedHint')}</p>
    </div>
  );
}
