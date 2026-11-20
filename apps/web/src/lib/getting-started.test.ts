import { describe, expect, it } from 'vitest';
import { allDone, startSteps, type StartFacts } from './getting-started';

const none: StartFacts = { profile: [], people: 1, readinessTaken: false, policiesApproved: 0 };

describe('startSteps', () => {
  it('starts with nothing done', () => {
    const steps = startSteps(none);
    expect(steps.map((s) => s.done)).toEqual([false, false, false, false]);
    expect(allDone(steps)).toBe(false);
  });

  it('needs all three company answers before the profile counts', () => {
    const profile = [
      { key: 'companyName', value: 'Acme' },
      { key: 'grievanceEmail', value: 'g@acme.in' },
    ];
    expect(startSteps({ ...none, profile })[0]!.done).toBe(false);
    profile.push({ key: 'breachContact', value: ' ' });
    expect(startSteps({ ...none, profile })[0]!.done).toBe(false);
    profile[2]!.value = 'Priya';
    expect(startSteps({ ...none, profile })[0]!.done).toBe(true);
  });

  it('counts people only once someone besides you is there', () => {
    expect(startSteps({ ...none, people: 1 })[1]!.done).toBe(false);
    expect(startSteps({ ...none, people: 2 })[1]!.done).toBe(true);
  });

  it('is finished when every job is', () => {
    const facts: StartFacts = {
      profile: [
        { key: 'companyName', value: 'Acme' },
        { key: 'grievanceEmail', value: 'g@acme.in' },
        { key: 'breachContact', value: 'Priya' },
      ],
      people: 3,
      readinessTaken: true,
      policiesApproved: 1,
    };
    expect(allDone(startSteps(facts))).toBe(true);
  });
});
