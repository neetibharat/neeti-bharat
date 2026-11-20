import { timeLeft } from './breach-clock';

export interface DeadlineLabel {
  /** The message to say, under `deadlines.late` or `deadlines.left`. */
  group: 'late' | 'left';
  unit: 'days' | 'hours' | 'minutes';
  count: number;
}

/** How long until a deadline, or how long past it, in the largest whole unit. */
export function deadlineLabel(dueOn: string, now: Date): DeadlineLabel {
  const left = timeLeft(dueOn, now);
  return { group: left.overdue ? 'late' : 'left', unit: left.unit, count: left[left.unit] };
}
