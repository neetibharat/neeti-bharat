import { BREACH_STEPS, type BreachStepResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { trackerSteps } from './breach-steps';

const steps = (doneCount: number): BreachStepResponse[] =>
  BREACH_STEPS.map((step, index) => ({
    step,
    completed: index < doneCount,
    completedAt: null,
    completedByName: null,
    note: null,
  }));

describe('trackerSteps', () => {
  it('marks the steps done, the next one current, and the rest upcoming', () => {
    expect(trackerSteps(steps(2)).map((s) => s.state)).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
      'upcoming',
    ]);
  });

  it('has no current step once every step is done', () => {
    expect(trackerSteps(steps(5)).map((s) => s.state)).toEqual(Array(5).fill('done'));
  });
});
