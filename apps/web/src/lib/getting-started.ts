import type { ProfileEntryResponse } from '@neeti-bharat/shared';

export type StartStepId = 'profile' | 'people' | 'readiness' | 'policies';

export interface StartStep {
  id: StartStepId;
  href: string;
  done: boolean;
}

export interface StartFacts {
  profile: Pick<ProfileEntryResponse, 'key' | 'value'>[];
  /** Everyone active, the person signed in included. */
  people: number;
  readinessTaken: boolean;
  policiesApproved: number;
}

/** The answers a company has to give before its policies and notices read as its own. */
const REQUIRED_ANSWERS = ['companyName', 'grievanceEmail', 'breachContact'];

const answered = (entries: StartFacts['profile'], key: string) =>
  entries.some((entry) => entry.key === key && entry.value.trim() !== '');

/** The first jobs of a new install, in the order to do them, each with whether it is done. */
export function startSteps(facts: StartFacts): StartStep[] {
  return [
    {
      id: 'profile',
      href: '/settings/company-profile',
      done: REQUIRED_ANSWERS.every((key) => answered(facts.profile, key)),
    },
    { id: 'people', href: '/settings/people', done: facts.people > 1 },
    { id: 'readiness', href: '/readiness', done: facts.readinessTaken },
    { id: 'policies', href: '/policies', done: facts.policiesApproved > 0 },
  ];
}

export const allDone = (steps: StartStep[]) => steps.every((step) => step.done);
