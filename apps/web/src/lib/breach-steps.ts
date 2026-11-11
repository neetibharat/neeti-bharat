import type { BreachStepResponse } from '@dpdp-kit/shared';

export type StepState = 'done' | 'current' | 'upcoming';

export interface TrackerStep extends BreachStepResponse {
  state: StepState;
}

/** Each step as done, the one to do now, or still to come. A closed breach has no current step. */
export function trackerSteps(steps: BreachStepResponse[]): TrackerStep[] {
  const currentIndex = steps.findIndex((entry) => !entry.completed);
  return steps.map((entry, index) => ({
    ...entry,
    state: entry.completed ? 'done' : index === currentIndex ? 'current' : 'upcoming',
  }));
}
