import type { ProfileEntryResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { closedOnTime, dueAtOf, isOverdue, replyWindowOf } from './request-due';

const DAY = 86_400_000;
const RECEIVED = new Date('2026-11-01T00:00:00Z');

const entry = (value: string, key = 'grievanceReplyTime') =>
  ({ key, value }) as unknown as ProfileEntryResponse;

describe('dueAtOf', () => {
  it('is the time received plus the reply time', () => {
    expect(dueAtOf(RECEIVED, 90 * DAY).toISOString()).toBe('2027-01-30T00:00:00.000Z');
  });
});

describe('isOverdue', () => {
  const base = { status: 'new' as const, dueAt: RECEIVED };

  it('is false until the due date has passed', () => {
    expect(isOverdue({ ...base, now: RECEIVED })).toBe(false);
  });

  it('is true once it has passed and the request is open', () => {
    const now = new Date(RECEIVED.getTime() + 1);
    expect(isOverdue({ ...base, now })).toBe(true);
    expect(isOverdue({ ...base, status: 'in_progress', now })).toBe(true);
  });

  it('is false for a request that is done', () => {
    expect(isOverdue({ ...base, status: 'done', now: new Date(RECEIVED.getTime() + DAY) })).toBe(
      false,
    );
  });
});

describe('replyWindowOf', () => {
  it('reads the grievance reply time from the profile', () => {
    expect(replyWindowOf([entry('30 days')])).toBe(30 * DAY);
    expect(replyWindowOf([entry('2 weeks')])).toBe(14 * DAY);
  });

  it('falls back to 90 days when the answer is empty, unreadable or missing', () => {
    expect(replyWindowOf([entry('')])).toBe(90 * DAY);
    expect(replyWindowOf([entry('soon')])).toBe(90 * DAY);
    expect(replyWindowOf([entry('30 days', 'breachReportWindow')])).toBe(90 * DAY);
    expect(replyWindowOf([])).toBe(90 * DAY);
  });
});

describe('closedOnTime', () => {
  const dueAt = RECEIVED;

  it('is null while the request is open', () => {
    expect(closedOnTime({ closedAt: null, dueAt })).toBeNull();
  });

  it('is true when closed by the due date, even at the last moment', () => {
    expect(closedOnTime({ closedAt: new Date(dueAt.getTime() - DAY), dueAt })).toBe(true);
    expect(closedOnTime({ closedAt: dueAt, dueAt })).toBe(true);
  });

  it('is false when closed after the due date', () => {
    expect(closedOnTime({ closedAt: new Date(dueAt.getTime() + 1), dueAt })).toBe(false);
  });
});
