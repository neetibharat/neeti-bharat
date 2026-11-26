import {
  DEFAULT_GRIEVANCE_REPLY_TIME_MS,
  parseDuration,
  type ProfileEntryResponse,
  type RequestStatus,
} from '@neeti-bharat/shared';

/** The due date: when the request was received plus the reply time. It is stored, so a later profile change does not move it. */
export const dueAtOf = (receivedAt: Date, windowMs: number): Date =>
  new Date(receivedAt.getTime() + windowMs);

/** Late means the request is not done and its due date has passed. */
export const isOverdue = (input: { status: RequestStatus; dueAt: Date; now: Date }): boolean =>
  input.status !== 'done' && input.now > input.dueAt;

/** Whether a closed request was closed by its due date. Null while it is open. */
export const closedOnTime = (input: { closedAt: Date | null; dueAt: Date }): boolean | null =>
  input.closedAt ? input.closedAt <= input.dueAt : null;

/** The "Grievance reply time" answer in milliseconds. A missing or unreadable answer means the default of 90 days. */
export function replyWindowOf(entries: ProfileEntryResponse[]): number {
  const answer = entries.find((entry) => entry.key === 'grievanceReplyTime')?.value ?? '';
  return parseDuration(answer) ?? DEFAULT_GRIEVANCE_REPLY_TIME_MS;
}
