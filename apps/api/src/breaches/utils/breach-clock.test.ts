import type { ProfileEntryResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { isOverdue, reportDueAt, reportWindowOf } from './breach-clock';

const HOUR = 3_600_000;
const FOUND = new Date('2026-11-10T00:00:00Z');

const entry = (value: string, key = 'breachReportWindow') =>
  ({ key, value }) as unknown as ProfileEntryResponse;

describe('reportDueAt', () => {
  it('is the time found plus the window', () => {
    expect(reportDueAt(FOUND, 72 * HOUR).toISOString()).toBe('2026-11-13T00:00:00.000Z');
  });
});

describe('isOverdue', () => {
  const base = { foundAt: FOUND, windowMs: 72 * HOUR, boardTold: false };

  it('is false until the window has passed', () => {
    expect(isOverdue({ ...base, now: new Date(FOUND.getTime() + 72 * HOUR) })).toBe(false);
  });

  it('is true once the window has passed and the Board is not told', () => {
    expect(isOverdue({ ...base, now: new Date(FOUND.getTime() + 72 * HOUR + 1) })).toBe(true);
  });

  it('stops when the Board is told', () => {
    const now = new Date(FOUND.getTime() + 100 * HOUR);
    expect(isOverdue({ ...base, boardTold: true, now })).toBe(false);
  });
});

describe('reportWindowOf', () => {
  it('reads the profile answer', () => {
    expect(reportWindowOf([entry('48 hours')])).toBe(48 * HOUR);
    expect(reportWindowOf([entry('2 days')])).toBe(48 * HOUR);
  });

  it('falls back to 72 hours when the answer is missing or unreadable', () => {
    expect(reportWindowOf([])).toBe(72 * HOUR);
    expect(reportWindowOf([entry('soon')])).toBe(72 * HOUR);
    expect(reportWindowOf([entry('', 'breachReportWindow')])).toBe(72 * HOUR);
    expect(reportWindowOf([entry('1 hour', 'other')])).toBe(72 * HOUR);
  });
});
