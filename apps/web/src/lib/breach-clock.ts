const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export interface TimeLeft {
  /** True once the due time has passed. */
  overdue: boolean;
  /** The whole days, hours and minutes between now and the due time, whichever side of it now is. */
  days: number;
  hours: number;
  minutes: number;
  /** The largest unit that is not zero, so a short label can leave out the smaller ones. */
  unit: 'days' | 'hours' | 'minutes';
}

/** How long until a due time, or how long past it. Whole minutes: the clock on screen ticks once a minute. */
export function timeLeft(dueAt: string, now: Date): TimeLeft {
  const diff = new Date(dueAt).getTime() - now.getTime();
  const span = Math.floor(Math.abs(diff) / MINUTE_MS) * MINUTE_MS;
  const days = Math.floor(span / DAY_MS);
  const hours = Math.floor((span % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((span % HOUR_MS) / MINUTE_MS);
  const unit = days > 0 ? 'days' : hours > 0 ? 'hours' : 'minutes';
  return { overdue: diff < 0, days, hours, minutes, unit };
}
