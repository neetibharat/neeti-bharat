/** What a person is asking for. Keep in step with the RequestType enum (a test checks). */
export const REQUEST_TYPES = [
  'access',
  'correction',
  'erasure',
  'nomination',
  'complaint',
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

/** A request is new until its identity is checked, in progress until it is closed, then done. */
export const REQUEST_STATUSES = ['new', 'in_progress', 'done'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Where a request came from. The customer page is not built, so `website` is never offered in the form. */
export const REQUEST_SOURCES = ['email', 'website', 'manual'] as const;
export type RequestSource = (typeof REQUEST_SOURCES)[number];

/** What came of a task: still to do, done, personal data erased, or kept because the law says so. */
export const TASK_OUTCOMES = ['todo', 'done', 'erased', 'kept_by_law'] as const;
export type TaskOutcome = (typeof TASK_OUTCOMES)[number];

/** The sources the form offers. */
export const REQUEST_FORM_SOURCES = ['manual', 'email'] as const satisfies readonly RequestSource[];

export const REQUEST_TABS = REQUEST_STATUSES;
export type RequestTab = RequestStatus;

/** How many requests the list shows on a page. */
export const REQUEST_PAGE_SIZE = 25;

export const REQUEST_NAME_MAX_LENGTH = 200;
export const REQUEST_EMAIL_MAX_LENGTH = 320;
export const REQUEST_TEXT_MAX_LENGTH = 5000;
export const REQUEST_NOTE_MAX_LENGTH = 2000;
export const REQUEST_SYSTEM_MAX_LENGTH = 200;
export const REQUEST_REASON_MAX_LENGTH = 1000;

/** The reply time when the company profile has none, or one that cannot be read. */
export const DEFAULT_GRIEVANCE_REPLY_TIME_MS = 90 * 24 * 60 * 60 * 1000;

/** How many cards each board column shows at first, and the most `GET /v1/requests/board` returns for one. */
export const REQUEST_BOARD_LIMIT = 10;
export const REQUEST_BOARD_MAX_LIMIT = 50;

/** The short name of a request, such as REQ-12. The number is its own, never reused. */
export const requestRef = (number: number): string => `REQ-${number}`;

/** A request due within this many days is shown as coming up. */
export const REQUEST_DUE_SOON_DAYS = 7;

/** One row of the requests list, from `GET /v1/requests`. Dates are ISO strings. */
export interface RequestListItem {
  id: string;
  /** The short number shown as REQ-<number>. */
  number: number;
  type: RequestType;
  personName: string;
  receivedAt: string;
  dueAt: string;
  status: RequestStatus;
  /** True while the request is not done and its due date has passed. */
  overdue: boolean;
  tasksDone: number;
  tasksTotal: number;
  /** Whether it was closed by its due date. Null while the request is open. */
  closedOnTime: boolean | null;
  /** Who deals with it, or null when it is the DPO's. */
  assigneeName: string | null;
}

export interface RequestCounts {
  new: number;
  in_progress: number;
  done: number;
  /** Open requests that are past their due date. */
  overdue: number;
}

/** One page of requests, from `GET /v1/requests?tab=&type=&q=&page=&limit=`. */
export interface RequestListResponse {
  items: RequestListItem[];
  /** How many requests the tab, the type and the search match, across every page. */
  total: number;
  page: number;
  pageSize: number;
  /** Head counts that do not change with the tab, the page or the search. */
  counts: RequestCounts;
}

/** One card on the board: only what a card shows. */
export interface RequestBoardCard {
  id: string;
  number: number;
  type: RequestType;
  personName: string;
  status: RequestStatus;
  dueAt: string;
  overdue: boolean;
  closedAt: string | null;
  /** True when closed by its due date, false when later, null while open. */
  closedOnTime: boolean | null;
  /** Who deals with it, or null when it is the DPO's. */
  assigneeName: string | null;
}

/** The latest cards of each column, from `GET /v1/requests/board?type=&q=&limit=`. */
export interface RequestBoardResponse {
  new: RequestBoardCard[];
  in_progress: RequestBoardCard[];
  done: RequestBoardCard[];
  /** Head counts that ignore the type, the search and the limit, like the list. */
  counts: RequestCounts;
}

/** The open requests that are late or due within a week, nearest first, from `GET /v1/requests/attention`. */
export interface RequestAttentionResponse {
  items: RequestListItem[];
  /** How many open requests are late or due within a week, across all of them. */
  total: number;
}

export interface RequestTaskResponse {
  id: string;
  system: string;
  outcome: TaskOutcome;
  /** Why the law says to keep the data. Only set when the outcome is `kept_by_law`. */
  reason: string | null;
}

/** One request with its tasks, from `GET /v1/requests/:id`. */
export interface RequestResponse {
  id: string;
  number: number;
  type: RequestType;
  source: RequestSource;
  status: RequestStatus;
  personName: string;
  personEmail: string;
  details: string;
  receivedAt: string;
  dueAt: string;
  overdue: boolean;
  identityVerifiedAt: string | null;
  identityVerifiedByName: string | null;
  identityNote: string | null;
  replyNote: string | null;
  closedAt: string | null;
  closedByName: string | null;
  loggedByName: string;
  /** Who deals with it, or null when it is the DPO's. */
  assignee: { id: string; name: string } | null;
  tasks: RequestTaskResponse[];
}

export interface CreateRequestRequest {
  type: RequestType;
  source?: RequestSource;
  personName: string;
  personEmail: string;
  details: string;
  /** ISO date and time it was received. Defaults to now. */
  receivedAt?: string;
  /** A person who has not left. Empty means the DPO deals with it. */
  assigneeId?: string | null;
}

export interface UpdateRequestRequest {
  type: RequestType;
  personName: string;
  personEmail: string;
  details: string;
  assigneeId: string | null;
}

export interface VerifyIdentityRequest {
  note?: string;
}

export interface AddRequestTaskRequest {
  system: string;
}

export interface UpdateRequestTaskRequest {
  outcome: TaskOutcome;
  /** Required when the outcome is `kept_by_law`. */
  reason?: string;
}

export interface CloseRequestRequest {
  /** The reply to the person. It is recorded, not sent. */
  replyNote: string;
}

/** Whether a request is done is only known once its identity is checked and every task has an outcome. */
export function isReadyToClose(input: {
  identityVerified: boolean;
  tasks: readonly { outcome: TaskOutcome }[];
}): boolean {
  return input.identityVerified && input.tasks.every((task) => task.outcome !== 'todo');
}
