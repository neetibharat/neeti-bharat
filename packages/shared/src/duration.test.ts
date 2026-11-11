import { describe, expect, it } from 'vitest';
import { parseDuration } from './duration.js';

const HOUR = 3_600_000;

describe('parseDuration', () => {
  it.each([
    ['72 hours', 72 * HOUR],
    ['1 hour', HOUR],
    ['90 days', 90 * 24 * HOUR],
    ['2 weeks', 14 * 24 * HOUR],
    ['30 minutes', 30 * 60_000],
    ['1 month', 30 * 24 * HOUR],
    ['1 year', 365 * 24 * HOUR],
  ])('reads %s', (text, expected) => {
    expect(parseDuration(text)).toBe(expected);
  });

  it('ignores case and spacing', () => {
    expect(parseDuration('  72HOURS ')).toBe(72 * HOUR);
    expect(parseDuration('3 Days')).toBe(72 * HOUR);
  });

  it.each([
    '',
    'soon',
    '72',
    'hours',
    '0 hours',
    '-5 hours',
    '1.5 hours',
    '72 fortnights',
    '2 hours 30 minutes',
  ])('refuses %j', (text) => {
    expect(parseDuration(text)).toBeNull();
  });
});
