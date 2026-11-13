/** What a notice is about. These match the dated kinds of work in My work. */
export const NOTIFICATION_KINDS = ['breach', 'request', 'proof', 'review'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Whether the date is close, or has passed. */
export const NOTIFICATION_STATES = ['due_soon', 'overdue'] as const;
export type NotificationState = (typeof NOTIFICATION_STATES)[number];

/** Work due within this many days is "due soon". */
export const NOTIFICATION_DUE_SOON_DAYS = 3;

export const NOTIFICATION_PAGE_SIZE = 20;

/** One notice for one person. The text is made from the kind, state, title and date, so it follows the language. */
export interface NotificationSummary {
  id: string;
  kind: NotificationKind;
  state: NotificationState;
  /** The id of the request, breach, proof requirement or policy it is about, for a link. */
  subjectId: string;
  /** What the thing is called, such as the name of the person who made a request. */
  title: string;
  /** The date it is due, as YYYY-MM-DD. */
  dueOn: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationSummary[];
  total: number;
  page: number;
  pageSize: number;
  /** How many are unread, whichever page this is. */
  unread: number;
}

export interface NotificationUnreadResponse {
  unread: number;
}

/** Which ways a person hears about one kind of notice. */
export interface NotificationPreference {
  kind: NotificationKind;
  inApp: boolean;
  email: boolean;
}

export interface NotificationPreferencesResponse {
  items: NotificationPreference[];
}

export type UpdateNotificationPreferencesRequest = NotificationPreferencesResponse;

/** What a role gets until a person chooses otherwise. A role and kind with no entry is on in both ways. */
export interface NotificationRoleDefault {
  role: 'admin' | 'member' | 'auditor';
  kind: NotificationKind;
  inApp: boolean;
  email: boolean;
}

export interface NotificationRoleDefaultsResponse {
  items: NotificationRoleDefault[];
}

export type UpdateNotificationRoleDefaultsRequest = NotificationRoleDefaultsResponse;
