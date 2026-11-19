import type { MyTrainingResponse, TeamTrainingRow, TrainingResponse } from '@dpdp-kit/shared';
import { day, iso } from '../../frameworks/utils/dates';
import type { TrainingRow } from '../repositories/training.repository';
import { trainingState } from './training-status';

type Completion = { trainingId: string; personId: string; completedAt: Date };
type InUse = {
  id: string;
  name: string;
  about: string | null;
  url: string | null;
  repeatsYearly: boolean;
  createdAt: Date;
};
type Who = { id: string; createdAt: Date };

export function toTrainingResponse(row: TrainingRow): TrainingResponse {
  return {
    id: row.id,
    name: row.name,
    about: row.about,
    url: row.url,
    repeatsYearly: row.repeatsYearly,
    archivedAt: iso(row.archivedAt),
    done: row._count.completions,
  };
}

/** Where one person stands with each training in use. */
function statesOf(trainings: InUse[], completions: Completion[], person: Who, now: Date) {
  return trainings.map((training) => {
    const completedAt =
      completions.find((c) => c.trainingId === training.id && c.personId === person.id)
        ?.completedAt ?? null;
    return {
      training,
      completedAt,
      ...trainingState({
        completedAt,
        repeatsYearly: training.repeatsYearly,
        trainingCreatedAt: training.createdAt,
        personCreatedAt: person.createdAt,
        now,
      }),
    };
  });
}

/** The latest completion, once nothing is left to do. Nothing while any training is to do. */
function lastDone(states: ReturnType<typeof statesOf>): Date | null {
  if (states.length === 0 || states.some((s) => s.status === 'todo')) return null;
  return states.reduce(
    (latest, s) => (s.completedAt! > latest ? s.completedAt! : latest),
    new Date(0),
  );
}

/** What one person has to do and has done, each training in use with where they stand. */
export function toMyTraining(
  trainings: InUse[],
  completions: Completion[],
  person: Who,
  now: Date,
): MyTrainingResponse {
  const states = statesOf(trainings, completions, person, now);
  return {
    items: states.map(({ training, completedAt, status, expiresOn, dueOn }) => ({
      id: training.id,
      name: training.name,
      about: training.about,
      url: training.url,
      completedOn: day(completedAt),
      repeatsYearly: training.repeatsYearly,
      status,
      expiresOn: day(expiresOn),
      dueOn: day(dueOn),
    })),
    completeOn: day(lastDone(states)),
  };
}

/** One person's progress through the trainings in use. */
export function toTeamRow(
  person: Who & { name: string; email: string },
  trainings: InUse[],
  completions: Completion[],
  now: Date,
): TeamTrainingRow {
  const states = statesOf(trainings, completions, person, now);
  return {
    personId: person.id,
    name: person.name,
    email: person.email,
    done: states.filter((s) => s.status !== 'todo').length,
    total: trainings.length,
    completeOn: day(lastDone(states)),
  };
}

/** Whether a person has nothing left to do. With no trainings, no one counts as trained. */
export const isTrained = (
  trainings: InUse[],
  completions: Completion[],
  person: Who,
  now: Date,
): boolean =>
  trainings.length > 0 &&
  statesOf(trainings, completions, person, now).every((s) => s.status !== 'todo');
