import { describe, expect, it } from 'vitest';
import { timeLeft } from './breach-clock';

const NOW = new Date('2026-11-10T12:00:00Z');
const later = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('timeLeft', () => {
  it('splits what is left into days, hours and minutes', () => {
    expect(timeLeft(later(2 * DAY + 5 * HOUR + 30 * MIN + 59_000), NOW)).toEqual({
      overdue: false,
      days: 2,
      hours: 5,
      minutes: 30,
      unit: 'days',
    });
  });

  it('uses the largest unit that is not zero', () => {
    expect(timeLeft(later(3 * HOUR + MIN), NOW)).toMatchObject({ unit: 'hours', hours: 3 });
    expect(timeLeft(later(5 * MIN), NOW)).toMatchObject({ unit: 'minutes', minutes: 5 });
  });

  it('is not overdue at the deadline itself', () => {
    expect(timeLeft(NOW.toISOString(), NOW)).toMatchObject({ overdue: false, minutes: 0 });
  });

  it('counts how long past the deadline it is', () => {
    expect(timeLeft(later(-(DAY + 2 * HOUR)), NOW)).toEqual({
      overdue: true,
      days: 1,
      hours: 2,
      minutes: 0,
      unit: 'days',
    });
    expect(timeLeft(later(-1), NOW).overdue).toBe(true);
  });
});
