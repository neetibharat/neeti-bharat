import { describe, expect, it } from 'vitest';
import { dayString } from './day-string';

describe('dayString', () => {
  it('accepts a real day', () => {
    expect(dayString.safeParse('2027-03-31').success).toBe(true);
  });

  it.each(['2027-3-1', '2027-02-30', '31/03/2027', ''])('refuses %s', (value) => {
    expect(dayString.safeParse(value).success).toBe(false);
  });
});
