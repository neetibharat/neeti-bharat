'use client';

import {
  PROOF_FREQUENCIES,
  type ProofFrequency,
  type ProofRequirementResponse,
  type SaveProofRequirementRequest,
} from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { DatePicker } from '@/components/base/date-picker/date-picker';
import { Select } from '@/components/base/select/select';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import { ProofStatusBadge } from '@/components/proof/proof-status-badge';
import { useSaveRequirementMutation } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Who collects the proof, how often, and by when. Each change is saved as soon as it is made. */
export function RequirementSettings({ requirement }: { requirement: ProofRequirementResponse }) {
  const t = useTranslations('proofPage.settings');
  const format = useFormatter();
  const errorMessage = useErrorMessage();
  const { change, error } = useSettingsSave(requirement);
  const nextDue = requirement.dueOn
    ? format.dateTime(new Date(requirement.dueOn), { dateStyle: 'medium' })
    : t('noDate');

  return (
    <Card title={t('title')} description={t('description')}>
      <SettingsFields requirement={requirement} change={change} />
      <p className="mt-4 text-caption text-fg-muted">{t('nextDue', { date: nextDue })}</p>
      {error ? (
        <Alert className="mt-3" tone="error">
          {errorMessage(error)}
        </Alert>
      ) : null}
    </Card>
  );
}

function SettingsFields(props: {
  requirement: ProofRequirementResponse;
  change: (values: Partial<SaveProofRequirementRequest>) => void;
}) {
  const { requirement, change } = props;
  const { canEdit } = useCan();
  const t = useTranslations('proofPage.settings');
  const tForm = useTranslations('frameworks.proof.form');

  return (
    <div className="grid gap-4">
      <Field label={t('status')}>
        <div className="flex h-10 items-center gap-2">
          <ProofStatusBadge status={requirement.status} />
          {requirement.overdue && <Badge color="danger">{t('overdue')}</Badge>}
        </div>
      </Field>
      <AssigneeSelect
        label={tForm('assignee')}
        noneLabel={tForm('controlOwner')}
        value={requirement.assigneeId}
        isDisabled={!canEdit}
        onChange={(assigneeId) => change({ assigneeId })}
      />
      <FrequencySelect
        value={requirement.frequency}
        isDisabled={!canEdit}
        onChange={(frequency) => change({ frequency })}
      />
      <DatePicker
        label={tForm('dueDate')}
        clearLabel={tForm('clearDate')}
        openLabel={tForm('openCalendar')}
        value={requirement.dueDate}
        isDisabled={!canEdit}
        onChange={(dueDate) => change({ dueDate })}
      />
    </div>
  );
}

function FrequencySelect(props: {
  value: ProofFrequency;
  isDisabled: boolean;
  onChange: (value: ProofFrequency) => void;
}) {
  const t = useTranslations('frameworks.proof');

  return (
    <Select
      label={t('form.frequency')}
      isDisabled={props.isDisabled}
      options={PROOF_FREQUENCIES.map((id) => ({ id, label: t(`frequencies.${id}`) }))}
      selectedKey={props.value}
      onSelectionChange={props.onChange}
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label font-semibold text-fg">{label}</span>
      {children}
    </div>
  );
}

/**
 * Saves each change as it is made. The settings live in one draft kept here, so a second change made before the first
 * has come back from the server still includes the first.
 */
function useSettingsSave(requirement: ProofRequirementResponse) {
  const [save, { error }] = useSaveRequirementMutation();
  const draft = useRef<SaveProofRequirementRequest>(settingsOf(requirement));
  const server = settingsOf(requirement);
  // A change that arrived from elsewhere replaces the draft.
  useEffect(() => {
    draft.current = server;
  }, [JSON.stringify(server)]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (values: Partial<SaveProofRequirementRequest>) => {
    draft.current = { ...draft.current, ...values };
    void save({ id: requirement.id, ...draft.current });
  };
  return { change, error };
}

const settingsOf = (requirement: ProofRequirementResponse): SaveProofRequirementRequest => ({
  title: requirement.title,
  description: requirement.description,
  frequency: requirement.frequency,
  assigneeId: requirement.assigneeId,
  dueDate: requirement.dueDate,
});
