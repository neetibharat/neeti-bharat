import type { MyWorkItem } from './frameworks/dpdp/my-work.js';

/** Where a deadline falls: already late, within the next 7 days, or further off. */
export const DEADLINE_TABS = ['overdue', 'week', 'later'] as const;
export type DeadlineTab = (typeof DEADLINE_TABS)[number];

/** How many days ahead counts as "this week". */
export const DEADLINE_WEEK_DAYS = 7;

/** One dated job, whoever it belongs to. */
export interface DeadlineItem extends MyWorkItem {
  /** The day and time it is due. Every deadline has one. */
  dueOn: string;
  /** Who it waits on, or null when it falls to the DPO and admins. */
  assigneeName: string | null;
}

export type DeadlineCounts = Record<DeadlineTab, number>;

/** One page of deadlines on one tab, with the counts for every tab, from `GET /v1/deadlines`. */
export interface DeadlinesResponse {
  items: DeadlineItem[];
  /** How many deadlines are on this tab, across every page. */
  total: number;
  page: number;
  pageSize: number;
  counts: DeadlineCounts;
}
