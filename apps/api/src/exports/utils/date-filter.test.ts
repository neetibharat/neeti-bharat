import { describe, expect, it } from 'vitest';
import { dateFilter, rangeText } from './date-filter';

describe('dateFilter', () => {
  it('is nothing for no range, or an empty one', () => {
    expect(dateFilter(undefined)).toBeUndefined();
    expect(dateFilter({})).toBeUndefined();
  });

  it('starts at the first day and stops after the last, so the last day is included', () => {
    expect(dateFilter({ from: '2026-04-01', to: '2026-06-30' })).toEqual({
      gte: new Date('2026-04-01T00:00:00.000Z'),
      lt: new Date('2026-07-01T00:00:00.000Z'),
    });
  });

  it('can be open at either end', () => {
    expect(dateFilter({ from: '2026-04-01' })).toEqual({
      gte: new Date('2026-04-01T00:00:00.000Z'),
    });
    expect(dateFilter({ to: '2026-12-31' })).toEqual({ lt: new Date('2027-01-01T00:00:00.000Z') });
  });
});

describe('rangeText', () => {
  it('reads the range for the log, and says nothing without one', () => {
    expect(rangeText({ from: '2026-04-01', to: '2026-06-30' })).toBe(
      ' from 2026-04-01 to 2026-06-30',
    );
    expect(rangeText({ to: '2026-06-30' })).toBe(' to 2026-06-30');
    expect(rangeText(undefined)).toBe('');
  });
});
