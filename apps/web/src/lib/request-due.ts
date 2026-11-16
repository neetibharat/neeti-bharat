import { REQUEST_DUE_SOON_DAYS, type RequestStatus } from '@dpdp-kit/shared';
import { timeLeft } from './breach-clock';

export type DueState = 'done' | 'overdue' | 'soon' | 'later';

/** Where a request stands against its due date: done, late, due within a week, or later. Worked out from the time now. */
export function dueState(request: { status: RequestStatus; dueAt: string }, now: Date): DueState {
  if (request.status === 'done') return 'done';
  const left = timeLeft(request.dueAt, now);
  if (left.overdue) return 'overdue';
  return left.days < REQUEST_DUE_SOON_DAYS ? 'soon' : 'later';
}
