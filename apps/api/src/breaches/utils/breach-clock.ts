import {
  DEFAULT_BREACH_REPORT_WINDOW_MS,
  parseDuration,
  type ProfileEntryResponse,
} from '@dpdp-kit/shared';

/** The time the Board must be told by: when the breach was found plus the report window. */
export const reportDueAt = (foundAt: Date, windowMs: number): Date =>
  new Date(foundAt.getTime() + windowMs);

/** Late means the Board has not been told and the report is past due. Telling the Board stops the clock. */
export function isOverdue(input: {
  foundAt: Date;
  windowMs: number;
  boardTold: boolean;
  now: Date;
}): boolean {
  return !input.boardTold && input.now > reportDueAt(input.foundAt, input.windowMs);
}

/** The "Breach report window" answer in milliseconds. A missing or unreadable answer means the default of 72 hours. */
export function reportWindowOf(entries: ProfileEntryResponse[]): number {
  const answer = entries.find((entry) => entry.key === 'breachReportWindow')?.value ?? '';
  return parseDuration(answer) ?? DEFAULT_BREACH_REPORT_WINDOW_MS;
}
