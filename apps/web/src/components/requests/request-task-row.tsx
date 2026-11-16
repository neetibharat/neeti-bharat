'use client';

import { IconTrash } from '@tabler/icons-react';
import {
  REQUEST_REASON_MAX_LENGTH,
  TASK_OUTCOMES,
  type RequestTaskResponse,
  type TaskOutcome,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { useRemoveRequestTaskMutation, useUpdateRequestTaskMutation } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { isTaskChanged, taskDraftOf, toTaskUpdate } from '@/lib/request-tasks';

export interface RequestTaskRowProps {
  requestId: string;
  task: RequestTaskResponse;
  /** False for an auditor, or once the request is closed. */
  canChange: boolean;
  /** Outcomes can be set only after the identity is checked. */
  identityVerified: boolean;
}

/** The draft of a task being changed, and what saving or removing it does. */
function useTaskEdit({ requestId, task }: Pick<RequestTaskRowProps, 'requestId' | 'task'>) {
  const [draft, setDraft] = useState(() => taskDraftOf(task));
  const [update, updating] = useUpdateRequestTaskMutation();
  const [remove, removing] = useRemoveRequestTaskMutation();
  const request = toTaskUpdate(draft);
  const save = (body: NonNullable<typeof request>) =>
    void update({ id: requestId, taskId: task.id, ...body });

  return {
    draft,
    setReason: (reason: string) => setDraft({ ...draft, reason }),
    // Kept by law waits for its reason; every other outcome is saved as soon as it is chosen.
    choose: (outcome: TaskOutcome) => {
      const next = { ...draft, outcome };
      setDraft(next);
      const body = toTaskUpdate(next);
      if (outcome !== 'kept_by_law' && body) save(body);
    },
    canSave: request !== null && isTaskChanged(task, draft),
    save: () => request && save(request),
    remove: () => void remove({ id: requestId, taskId: task.id }),
    isSaving: updating.isLoading,
    isRemoving: removing.isLoading,
    error: updating.error ?? removing.error,
  };
}

type TaskEdit = ReturnType<typeof useTaskEdit>;

/** What came of the system, and a way to remove it while it is still to do. */
function Outcome(props: RequestTaskRowProps & { edit: TaskEdit }) {
  const { task, edit } = props;
  const t = useTranslations('requests.tasks');
  const tOutcomes = useTranslations('requests.outcomes');

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label={t('outcome', { system: task.system })}
        className="w-44"
        options={TASK_OUTCOMES.map((id) => ({ id, label: tOutcomes(id) }))}
        selectedKey={edit.draft.outcome}
        onSelectionChange={edit.choose}
        isDisabled={!props.canChange || !props.identityVerified}
      />
      {props.canChange && task.outcome === 'todo' && (
        <Button
          color="tertiary"
          isIconOnly
          aria-label={t('remove', { system: task.system })}
          isLoading={edit.isRemoving}
          onPress={edit.remove}
        >
          <IconTrash className="size-4" />
        </Button>
      )}
    </div>
  );
}

/** The reason the law keeps the data. It is saved with its own button, since an outcome alone is not enough. */
function Reason(props: RequestTaskRowProps & { edit: TaskEdit }) {
  const t = useTranslations('requests.tasks');
  const { edit } = props;
  const editable = props.canChange && props.identityVerified;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        label={t('reason')}
        hint={t('reasonHint')}
        className="min-w-60 flex-1"
        value={edit.draft.reason}
        onChange={edit.setReason}
        maxLength={REQUEST_REASON_MAX_LENGTH}
        isDisabled={!editable}
      />
      {editable && edit.canSave && (
        <Button isLoading={edit.isSaving} onPress={edit.save}>
          {t('save')}
        </Button>
      )}
    </div>
  );
}

/** One system: what came of it, and why the law keeps the data if it does. */
export function RequestTaskRow(props: RequestTaskRowProps) {
  const errorMessage = useErrorMessage();
  const edit = useTaskEdit(props);

  return (
    <li className="flex flex-col gap-3 rounded-control border border-line px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-body font-medium break-words text-fg">{props.task.system}</p>
        <Outcome {...props} edit={edit} />
      </div>
      {edit.draft.outcome === 'kept_by_law' && <Reason {...props} edit={edit} />}
      {edit.error ? <Alert tone="error">{errorMessage(edit.error)}</Alert> : null}
    </li>
  );
}
