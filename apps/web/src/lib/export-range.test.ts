import { describe, expect, it } from 'vitest';
import { presetRange, rangeQuery } from './export-range';

describe('presetRange', () => {
  it('counts the last 30 days with today included', () => {
    expect(presetRange('last30', new Date(2026, 10, 20))).toEqual({
      start: '2026-10-22',
      end: '2026-11-20',
    });
  });

  it('starts this financial year on 1 April, and runs it to today', () => {
    expect(presetRange('thisYear', new Date(2026, 10, 20))).toEqual({
      start: '2026-04-01',
      end: '2026-11-20',
    });
  });

  it("is still in last year's financial year until 1 April", () => {
    expect(presetRange('thisYear', new Date(2027, 1, 10))).toEqual({
      start: '2026-04-01',
      end: '2027-02-10',
    });
    expect(presetRange('thisYear', new Date(2027, 3, 1)).start).toBe('2027-04-01');
  });

  it('gives the whole of the financial year before', () => {
    expect(presetRange('lastYear', new Date(2026, 10, 20))).toEqual({
      start: '2025-04-01',
      end: '2026-03-31',
    });
    expect(presetRange('lastYear', new Date(2027, 1, 10))).toEqual({
      start: '2025-04-01',
      end: '2026-03-31',
    });
  });
});

describe('rangeQuery', () => {
  it('writes both days, and nothing for no range', () => {
    expect(rangeQuery(null)).toBe('');
    expect(rangeQuery({ start: '2026-04-01', end: '2026-06-30' })).toBe(
      '?from=2026-04-01&to=2026-06-30',
    );
  });
});
