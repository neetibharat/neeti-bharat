/** The five steps of a breach, in the order they are done. Keep in step with the BreachStep enum (a test checks). */
export const BREACH_STEPS = ['found', 'assess', 'tell_board', 'tell_people', 'close'] as const;

export type BreachStep = (typeof BREACH_STEPS)[number];

export const BREACH_TABS = ['open', 'closed'] as const;
export type BreachTab = (typeof BREACH_TABS)[number];

/** How many breaches the list shows on a page. */
export const BREACH_PAGE_SIZE = 25;

export const BREACH_TITLE_MAX_LENGTH = 200;
export const BREACH_TEXT_MAX_LENGTH = 5000;
export const BREACH_NOTE_MAX_LENGTH = 2000;

/** The Board report window when the company profile has none, or one that cannot be read. */
export const DEFAULT_BREACH_REPORT_WINDOW_MS = 72 * 60 * 60 * 1000;

/** The step to do next, given the steps already done. Null once every step is done. */
export function nextBreachStep(done: readonly BreachStep[]): BreachStep | null {
  return BREACH_STEPS.find((step) => !done.includes(step)) ?? null;
}

/** Whether the Board has yet to be told, which is while the report clock is running. A closed breach has no current step. */
export function isBoardPending(currentStep: BreachStep | null): boolean {
  if (currentStep === null) return false;
  return BREACH_STEPS.indexOf(currentStep) <= BREACH_STEPS.indexOf('tell_board');
}

/** One row of the breaches list, from `GET /v1/breaches`. Dates are ISO strings. */
export interface BreachListItem {
  id: string;
  title: string;
  foundAt: string;
  peopleAffected: number | null;
  /** The step to do next, or null once the breach is closed. */
  currentStep: BreachStep | null;
  /** When the Board report is due: when it was found plus the report window. */
  reportDueAt: string;
  /** True while the Board has not been told and the report is past due. */
  overdue: boolean;
  closedAt: string | null;
  /** Who deals with it, or null when it is the DPO's. */
  assigneeName: string | null;
}

export interface BreachCounts {
  open: number;
  closed: number;
  /** Open breaches whose Board report is late. */
  overdue: number;
}

/** One page of breaches, from `GET /v1/breaches?tab=&q=&page=&limit=`. */
export interface BreachListResponse {
  items: BreachListItem[];
  /** How many breaches the tab and the search match, across every page. */
  total: number;
  page: number;
  pageSize: number;
  /** Head counts that do not change with the tab, the page or the search. */
  counts: BreachCounts;
}

export interface BreachStepResponse {
  step: BreachStep;
  completed: boolean;
  completedAt: string | null;
  completedByName: string | null;
  note: string | null;
}

/** One breach with all five steps, from `GET /v1/breaches/:id`. */
export interface BreachResponse {
  id: string;
  title: string;
  description: string;
  foundAt: string;
  affectedSystems: string;
  affectedData: string;
  peopleAffected: number | null;
  reportedByName: string;
  steps: BreachStepResponse[];
  currentStep: BreachStep | null;
  reportDueAt: string;
  overdue: boolean;
  closedAt: string | null;
  /** Who deals with it, or null when it is the DPO's. */
  assignee: { id: string; name: string } | null;
}

export interface CreateBreachRequest {
  title: string;
  description: string;
  /** ISO date and time it was found. Defaults to now. */
  foundAt?: string;
  affectedSystems: string;
  affectedData: string;
  peopleAffected?: number;
  /** A person who has not left. Empty means the DPO deals with it. */
  assigneeId?: string | null;
}

export interface UpdateBreachRequest {
  title: string;
  description: string;
  foundAt: string;
  affectedSystems: string;
  affectedData: string;
  peopleAffected: number | null;
  assigneeId: string | null;
}

export interface CompleteBreachStepRequest {
  note?: string;
}
