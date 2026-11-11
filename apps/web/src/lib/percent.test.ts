import { describe, expect, it } from 'vitest';
import { percentOf } from './percent';

describe('percentOf', () => {
  it('rounds to a whole number', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(5, 5)).toBe(100);
  });

  it('is zero when there is nothing to do', () => {
    expect(percentOf(0, 0)).toBe(0);
  });
});
