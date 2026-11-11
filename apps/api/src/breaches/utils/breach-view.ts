import {
  BREACH_STEPS,
  nextBreachStep,
  type BreachListItem,
  type BreachResponse,
  type BreachStep,
} from '@dpdp-kit/shared';
import { iso } from '../../frameworks/utils/dates';
import { isOverdue, reportDueAt } from './breach-clock';

/** A step that has been done. */
export interface StepRow {
  step: BreachStep;
  completedAt: Date;
  completedByName: string;
  note: string | null;
}

/** What the list needs of a breach. */
export interface BreachSummaryRow {
  id: string;
  title: string;
  foundAt: Date;
  peopleAffected: number | null;
  assignee: { id: string; name: string } | null;
  steps: Pick<StepRow, 'step' | 'completedAt'>[];
}

export interface BreachRow extends BreachSummaryRow {
  description: string;
  affectedSystems: string;
  affectedData: string;
  reportedByName: string;
  steps: StepRow[];
}

/** What the clock needs: how long the Board has, and the time now. */
export interface Clock {
  windowMs: number;
  now: Date;
}

/** Where a breach stands: the step to do next, when the Board report is due, and whether it is late. */
export function stateOf(row: BreachSummaryRow, clock: Clock) {
  const done = row.steps.map((entry) => entry.step);
  return {
    currentStep: nextBreachStep(done),
    reportDueAt: reportDueAt(row.foundAt, clock.windowMs),
    overdue: isOverdue({
      foundAt: row.foundAt,
      windowMs: clock.windowMs,
      boardTold: done.includes('tell_board'),
      now: clock.now,
    }),
    closedAt: row.steps.find((entry) => entry.step === 'close')?.completedAt ?? null,
  };
}

export function toListItem(row: BreachSummaryRow, clock: Clock): BreachListItem {
  const state = stateOf(row, clock);
  return {
    id: row.id,
    title: row.title,
    foundAt: row.foundAt.toISOString(),
    peopleAffected: row.peopleAffected,
    currentStep: state.currentStep,
    reportDueAt: state.reportDueAt.toISOString(),
    overdue: state.overdue,
    closedAt: iso(state.closedAt),
    assigneeName: row.assignee?.name ?? null,
  };
}

/** All five steps in order, each done or still to do. */
function stepsOf(row: BreachRow): BreachResponse['steps'] {
  return BREACH_STEPS.map((step) => {
    const entry = row.steps.find((candidate) => candidate.step === step);
    return {
      step,
      completed: Boolean(entry),
      completedAt: iso(entry?.completedAt ?? null),
      completedByName: entry?.completedByName ?? null,
      note: entry?.note ?? null,
    };
  });
}

export function toBreachResponse(row: BreachRow, clock: Clock): BreachResponse {
  const state = stateOf(row, clock);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    foundAt: row.foundAt.toISOString(),
    affectedSystems: row.affectedSystems,
    affectedData: row.affectedData,
    peopleAffected: row.peopleAffected,
    reportedByName: row.reportedByName,
    steps: stepsOf(row),
    currentStep: state.currentStep,
    reportDueAt: state.reportDueAt.toISOString(),
    overdue: state.overdue,
    closedAt: iso(state.closedAt),
    assignee: row.assignee,
  };
}
