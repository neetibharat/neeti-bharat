import type {
  RequestCounts,
  RequestListResponse,
  RequestStatus,
  RequestTab,
  RequestType,
} from '@neeti-bharat/shared';
import { toListItem, type RequestSummaryRow } from './request-view';

export interface RequestListQuery {
  tab: RequestTab;
  type?: RequestType;
  q?: string;
  page: number;
  limit: number;
}

/** A search such as `REQ-12` or `12` names a request number. Longer digits would overflow the column. */
export function numberOfSearch(q: string): number | null {
  const match = /^(?:req-)?(\d{1,9})$/i.exec(q.trim());
  return match ? Number(match[1]) : null;
}

/** The rows a request list query matches: the tab, the type if one is chosen, and the search in number, name, email and details. */
export function listWhere(query: Pick<RequestListQuery, 'tab' | 'type' | 'q'>) {
  const number = query.q ? numberOfSearch(query.q) : null;
  const search = query.q
    ? {
        OR: [
          ...(number === null ? [] : [{ number }]),
          { personName: { contains: query.q, mode: 'insensitive' as const } },
          { personEmail: { contains: query.q, mode: 'insensitive' as const } },
          { details: { contains: query.q, mode: 'insensitive' as const } },
        ],
      }
    : {};
  return { status: query.tab, ...(query.type ? { type: query.type } : {}), ...search };
}

/** Open requests: the nearest due date first, so late ones lead. Done requests: the latest closed first. The number settles ties, so a page never repeats or skips a request. */
export const listOrder = (tab: RequestTab) =>
  tab === 'done'
    ? [{ closedAt: 'desc' as const }, { number: 'desc' as const }]
    : [{ dueAt: 'asc' as const }, { number: 'asc' as const }];

/** The head counts: how many requests have each status, and how many open ones are late. */
export function requestCounts(
  byStatus: { status: RequestStatus; count: number }[],
  overdue: number,
): RequestCounts {
  const of = (status: RequestStatus) =>
    byStatus.find((entry) => entry.status === status)?.count ?? 0;
  return { new: of('new'), in_progress: of('in_progress'), done: of('done'), overdue };
}

/** One page of the list from the rows the database returned for it. */
export function requestListPage(
  rows: RequestSummaryRow[],
  total: number,
  query: Pick<RequestListQuery, 'page' | 'limit'>,
  counts: RequestCounts,
  now: Date,
): RequestListResponse {
  return {
    items: rows.map((row) => toListItem(row, now)),
    total,
    page: query.page,
    pageSize: query.limit,
    counts,
  };
}
