import { describe, expect, it } from 'vitest';
import { deadlineLabel } from './deadline-label';

const now = new Date('2026-11-20T10:00:00.000Z');

describe('deadlineLabel', () => {
  it('counts down in hours when under a day', () => {
    expect(deadlineLabel('2026-11-21T06:00:00.000Z', now)).toEqual({
      group: 'left',
      unit: 'hours',
      count: 20,
    });
  });

  it('counts days once a day or more is left', () => {
    expect(deadlineLabel('2026-11-23T10:00:00.000Z', now)).toEqual({
      group: 'left',
      unit: 'days',
      count: 3,
    });
  });

  it('says how late it is once past', () => {
    expect(deadlineLabel('2026-11-18T10:00:00.000Z', now)).toEqual({
      group: 'late',
      unit: 'days',
      count: 2,
    });
  });
});
