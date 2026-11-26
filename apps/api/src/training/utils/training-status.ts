import {
  TRAINING_DUE_DAYS,
  TRAINING_RENEWAL_DAYS,
  TRAINING_RENEWAL_WARNING_DAYS,
  type TrainingStatus,
} from '@neeti-bharat/shared';

const DAY_MS = 24 * 60 * 60 * 1000;
const after = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

export interface TrainingState {
  status: TrainingStatus;
  /** When a yearly training lapses. */
  expiresOn: Date | null;
  /** When it is due, while it is to do or due again. */
  dueOn: Date | null;
}

export interface TrainingFacts {
  completedAt: Date | null;
  repeatsYearly: boolean;
  trainingCreatedAt: Date;
  personCreatedAt: Date;
  now: Date;
}

/**
 * Where one person stands with one training. One never taken is due a month after the person joined, or the training
 * was added if that is later. A yearly one lapses after a year, and is shown as due again for the month before.
 */
export function trainingState(facts: TrainingFacts): TrainingState {
  const { completedAt, now } = facts;
  if (!completedAt) {
    const since =
      facts.personCreatedAt > facts.trainingCreatedAt
        ? facts.personCreatedAt
        : facts.trainingCreatedAt;
    return { status: 'todo', expiresOn: null, dueOn: after(since, TRAINING_DUE_DAYS) };
  }
  if (!facts.repeatsYearly) return { status: 'done', expiresOn: null, dueOn: null };

  const expiresOn = after(completedAt, TRAINING_RENEWAL_DAYS);
  if (expiresOn <= now) return { status: 'todo', expiresOn, dueOn: expiresOn };
  const soon = expiresOn.getTime() - now.getTime() <= TRAINING_RENEWAL_WARNING_DAYS * DAY_MS;
  return { status: soon ? 'renew' : 'done', expiresOn, dueOn: soon ? expiresOn : null };
}
