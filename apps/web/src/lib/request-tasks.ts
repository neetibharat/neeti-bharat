import {
  isReadyToClose,
  type RequestResponse,
  type RequestTaskResponse,
  type TaskOutcome,
  type UpdateRequestTaskRequest,
} from '@dpdp-kit/shared';

/** What stops a request from being closed: the identity check first, then tasks still to do. Null when nothing does. */
export type CloseBlocker = 'identity' | 'tasks' | null;

export function closeBlocker(
  request: Pick<RequestResponse, 'identityVerifiedAt' | 'tasks'>,
): CloseBlocker {
  if (!request.identityVerifiedAt) return 'identity';
  return isReadyToClose({ identityVerified: true, tasks: request.tasks }) ? null : 'tasks';
}

/** How many tasks are still to do. */
export const tasksToDo = (tasks: readonly Pick<RequestTaskResponse, 'outcome'>[]): number =>
  tasks.filter((task) => task.outcome === 'todo').length;

/** What a task row holds while it is being changed. */
export interface TaskDraft {
  outcome: TaskOutcome;
  reason: string;
}

export const taskDraftOf = (task: RequestTaskResponse): TaskDraft => ({
  outcome: task.outcome,
  reason: task.reason ?? '',
});

/** The request for a draft, or null while kept by law has no reason. Any other outcome sends no reason. */
export function toTaskUpdate(draft: TaskDraft): UpdateRequestTaskRequest | null {
  if (draft.outcome !== 'kept_by_law') return { outcome: draft.outcome };
  const reason = draft.reason.trim();
  return reason ? { outcome: 'kept_by_law', reason } : null;
}

/** Whether the draft differs from what is saved, so Save is offered only for a real change. */
export function isTaskChanged(task: RequestTaskResponse, draft: TaskDraft): boolean {
  if (draft.outcome !== task.outcome) return true;
  return draft.outcome === 'kept_by_law' && draft.reason.trim() !== (task.reason ?? '');
}
