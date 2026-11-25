import { describe, expect, it } from 'vitest';
import { trainingState } from './training-status';

const at = (day: string) => new Date(`${day}T09:00:00.000Z`);
const base = {
  repeatsYearly: false,
  trainingCreatedAt: at('2026-01-01'),
  personCreatedAt: at('2026-01-01'),
  now: at('2026-06-01'),
};

describe('trainingState', () => {
  it('is to do until taken, due a month after the person joined or the training was added', () => {
    const state = trainingState({ ...base, completedAt: null, personCreatedAt: at('2026-05-10') });
    expect(state.status).toBe('todo');
    expect(state.dueOn).toEqual(at('2026-06-09'));
  });

  it('is done for good once taken, unless it repeats', () => {
    expect(trainingState({ ...base, completedAt: at('2020-01-01') })).toEqual({
      status: 'done',
      expiresOn: null,
      dueOn: null,
    });
  });

  it('is done for a year when it repeats, then due again for the last month', () => {
    const repeats = { ...base, repeatsYearly: true };
    expect(trainingState({ ...repeats, completedAt: at('2026-03-01') }).status).toBe('done');
    const soon = trainingState({ ...repeats, completedAt: at('2025-06-20') });
    expect(soon.status).toBe('renew');
    expect(soon.dueOn).toEqual(at('2026-06-20'));
  });

  it('is to do again, and late, once a yearly one has lapsed', () => {
    const lapsed = trainingState({ ...base, repeatsYearly: true, completedAt: at('2025-05-01') });
    expect(lapsed.status).toBe('todo');
    expect(lapsed.dueOn).toEqual(at('2026-05-01'));
  });
});
