'use client';

import {
  BREACH_TEXT_MAX_LENGTH,
  BREACH_TITLE_MAX_LENGTH,
  type UpdateBreachRequest,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { DatePicker } from '@/components/base/date-picker/date-picker';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Textarea } from '@/components/base/textarea/textarea';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import { toBreachRequest, type BreachValues } from '@/lib/breach-form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';

export interface BreachFormProps {
  initial: BreachValues;
  isSaving: boolean;
  error: unknown;
  submitLabel: string;
  onSubmit: (request: UpdateBreachRequest) => void;
  onCancel: () => void;
}

/** The form for reporting a breach or editing its details. */
export function BreachForm(props: BreachFormProps) {
  const { initial, isSaving, error, submitLabel, onSubmit, onCancel } = props;
  const t = useTranslations('breaches.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(initial);
  const request = toBreachRequest(values);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (request) onSubmit(request);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <BreachFields values={values} onChange={patch} />
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
  values: BreachValues;
  onChange: (change: Partial<BreachValues>) => void;
}

const setter =
  (onChange: FieldsProps['onChange']) =>
  <K extends keyof BreachValues>(key: K) =>
  (value: BreachValues[K]) =>
    onChange({ [key]: value });

function BreachFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('breaches.form');
  const set = setter(onChange);

  return (
    <>
      <Input
        label={t('title')}
        value={values.title}
        onChange={set('title')}
        maxLength={BREACH_TITLE_MAX_LENGTH}
        isRequired
        autoFocus
      />
      <Textarea
        label={t('description')}
        hint={t('descriptionHint')}
        value={values.description}
        onChange={set('description')}
        maxLength={BREACH_TEXT_MAX_LENGTH}
        isRequired
      />
      <FoundAt values={values} onChange={onChange} />
      <AffectedFields values={values} onChange={onChange} />
      <Assignee values={values} onChange={onChange} />
    </>
  );
}

/** What was affected: the systems, the personal data and how many people. */
function AffectedFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('breaches.form');
  const set = setter(onChange);

  return (
    <>
      <Textarea
        label={t('systems')}
        value={values.affectedSystems}
        onChange={set('affectedSystems')}
        maxLength={BREACH_TEXT_MAX_LENGTH}
        rows={2}
        isRequired
      />
      <Textarea
        label={t('data')}
        value={values.affectedData}
        onChange={set('affectedData')}
        maxLength={BREACH_TEXT_MAX_LENGTH}
        rows={2}
        isRequired
      />
      <Input
        type="number"
        inputMode="numeric"
        label={t('people')}
        hint={t('peopleHint')}
        value={values.peopleAffected}
        onChange={set('peopleAffected')}
        className="max-w-48"
      />
    </>
  );
}

/** Who deals with it. Nobody means the DPO. */
function Assignee({ values, onChange }: FieldsProps) {
  const t = useTranslations('breaches.form');

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

/** The day and the time it was found. The report clock starts from here. */
function FoundAt({ values, onChange }: FieldsProps) {
  const t = useTranslations('breaches.form');

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label={t('foundDate')}
          value={values.foundDate}
          onChange={(foundDate) => onChange({ foundDate })}
          clearLabel={t('clearDate')}
          openLabel={t('openCalendar')}
        />
        <Input
          type="time"
          label={t('foundTime')}
          value={values.foundTime}
          onChange={(foundTime) => onChange({ foundTime })}
          isRequired
        />
      </div>
      <p className="text-caption text-fg-subtle">{t('foundHint')}</p>
    </div>
  );
}
