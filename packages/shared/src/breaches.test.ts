import { describe, expect, it } from 'vitest';
import { BREACH_STEPS, isBoardPending, nextBreachStep } from './breaches.js';

describe('nextBreachStep', () => {
  it('starts after found and moves one step at a time', () => {
    expect(nextBreachStep(['found'])).toBe('assess');
    expect(nextBreachStep(['found', 'assess'])).toBe('tell_board');
    expect(nextBreachStep(['found', 'assess', 'tell_board'])).toBe('tell_people');
    expect(nextBreachStep(['found', 'assess', 'tell_board', 'tell_people'])).toBe('close');
  });

  it('is null when every step is done', () => {
    expect(nextBreachStep([...BREACH_STEPS])).toBeNull();
  });
});

describe('isBoardPending', () => {
  it('holds until the Board is told, and not for a closed breach', () => {
    expect(isBoardPending('assess')).toBe(true);
    expect(isBoardPending('tell_board')).toBe(true);
    expect(isBoardPending('tell_people')).toBe(false);
    expect(isBoardPending(null)).toBe(false);
  });
});
