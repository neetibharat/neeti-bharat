import { describe, expect, it } from 'vitest';
import { day, dayToDate, iso, lastProvided } from './dates';

describe('dates', () => {
  it('turns a moment into an ISO string or a day, and nothing into null', () => {
    const moment = new Date('2027-03-31T10:30:00.000Z');
    expect(iso(moment)).toBe('2027-03-31T10:30:00.000Z');
    expect(day(moment)).toBe('2027-03-31');
    expect(iso(null)).toBeNull();
    expect(day(null)).toBeNull();
  });

  it('turns a day into the start of that day in UTC', () => {
    expect(dayToDate('2027-03-31')?.toISOString()).toBe('2027-03-31T00:00:00.000Z');
    expect(dayToDate(null)).toBeNull();
  });

  it('takes the newest proof as the last one given', () => {
    const newest = new Date('2027-02-01T00:00:00.000Z');
    expect(lastProvided([{ createdAt: newest }, { createdAt: new Date(0) }])).toBe(newest);
    expect(lastProvided([])).toBeNull();
  });
});
