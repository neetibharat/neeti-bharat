import type {
  RequestListItem,
  RequestResponse,
  RequestSource,
  RequestStatus,
  RequestType,
  TaskOutcome,
} from '@neeti-bharat/shared';
import { iso } from '../../frameworks/utils/dates';
import { closedOnTime, isOverdue } from './request-due';

/** What the list needs of a request. */
export interface RequestSummaryRow {
  id: string;
  number: number;
  type: RequestType;
  personName: string;
  receivedAt: Date;
  dueAt: Date;
  status: RequestStatus;
  closedAt: Date | null;
  assignee: { id: string; name: string } | null;
  tasks: { outcome: TaskOutcome }[];
}

export interface TaskRow {
  id: string;
  system: string;
  outcome: TaskOutcome;
  reason: string | null;
}

export interface RequestRow extends Omit<RequestSummaryRow, 'tasks'> {
  source: RequestSource;
  personEmail: string;
  details: string;
  identityVerifiedAt: Date | null;
  identityVerifiedByName: string | null;
  identityNote: string | null;
  replyNote: string | null;
  closedByName: string | null;
  loggedByName: string;
  tasks: TaskRow[];
}

export function toListItem(row: RequestSummaryRow, now: Date): RequestListItem {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    personName: row.personName,
    receivedAt: row.receivedAt.toISOString(),
    dueAt: row.dueAt.toISOString(),
    status: row.status,
    overdue: isOverdue({ status: row.status, dueAt: row.dueAt, now }),
    tasksDone: row.tasks.filter((task) => task.outcome !== 'todo').length,
    tasksTotal: row.tasks.length,
    closedOnTime: closedOnTime(row),
    assigneeName: row.assignee?.name ?? null,
  };
}

export function toRequestResponse(row: RequestRow, now: Date): RequestResponse {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    source: row.source,
    status: row.status,
    personName: row.personName,
    personEmail: row.personEmail,
    details: row.details,
    receivedAt: row.receivedAt.toISOString(),
    dueAt: row.dueAt.toISOString(),
    overdue: isOverdue({ status: row.status, dueAt: row.dueAt, now }),
    identityVerifiedAt: iso(row.identityVerifiedAt),
    identityVerifiedByName: row.identityVerifiedByName,
    identityNote: row.identityNote,
    replyNote: row.replyNote,
    closedAt: iso(row.closedAt),
    closedByName: row.closedByName,
    loggedByName: row.loggedByName,
    assignee: row.assignee,
    tasks: row.tasks.map(({ id, system, outcome, reason }) => ({ id, system, outcome, reason })),
  };
}
