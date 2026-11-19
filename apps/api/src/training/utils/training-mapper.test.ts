import { describe, expect, it } from 'vitest';
import { isTrained, toMyTraining, toTeamRow } from './training-mapper';

const now = new Date('2026-11-20T09:00:00.000Z');
const created = new Date('2026-01-01T00:00:00.000Z');
const inUse = [
  { id: 't1', name: 'Awareness', about: null, url: null, repeatsYearly: false, createdAt: created },
  {
    id: 't2',
    name: 'Breaches',
    about: 'What to report',
    url: 'https://example.com/v',
    repeatsYearly: false,
    createdAt: created,
  },
];
const person = { id: 'p1', createdAt: created };
const done = (trainingId: string, day: string, personId = 'p1') => ({
  trainingId,
  personId,
  completedAt: new Date(`${day}T09:00:00.000Z`),
});

describe('toMyTraining', () => {
  it('shows the day each training was completed, and a due day for one still to do', () => {
    const mine = toMyTraining(inUse, [done('t1', '2026-11-10')], person, now);
    expect(mine.items.map((item) => item.completedOn)).toEqual(['2026-11-10', null]);
    expect(mine.items.map((item) => item.status)).toEqual(['done', 'todo']);
    expect(mine.items[1]?.dueOn).toBe('2026-01-31');
    expect(mine.completeOn).toBeNull();
  });

  it('gives the day of the last one once every training is done', () => {
    const both = [done('t1', '2026-11-10'), done('t2', '2026-11-12')];
    expect(toMyTraining(inUse, both, person, now).completeOn).toBe('2026-11-12');
  });

  it('is never complete when there is nothing to take', () => {
    expect(toMyTraining([], [], person, now).completeOn).toBeNull();
  });
});

describe('toTeamRow and isTrained', () => {
  const who = { ...person, name: 'Asha', email: 'asha@example.com' };

  it('counts only that person and only the trainings in use', () => {
    const completions = [
      done('t1', '2026-11-10'),
      done('gone', '2026-11-11'),
      done('t2', '2026-11-12', 'p2'),
    ];
    expect(toTeamRow(who, inUse, completions, now)).toMatchObject({
      done: 1,
      total: 2,
      completeOn: null,
    });
    expect(isTrained(inUse, completions, person, now)).toBe(false);
  });

  it('treats a lapsed yearly training as not done', () => {
    const yearly = inUse.map((t) => ({ ...t, repeatsYearly: true }));
    const old = [done('t1', '2025-01-01'), done('t2', '2026-11-01')];
    expect(toTeamRow(who, yearly, old, now).done).toBe(1);
    expect(isTrained(yearly, old, person, now)).toBe(false);
  });
});
