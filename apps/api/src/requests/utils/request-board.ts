import type {
  RequestBoardCard,
  RequestBoardResponse,
  RequestCounts,
  RequestStatus,
} from '@dpdp-kit/shared';
import { iso } from '../../frameworks/utils/dates';
import { closedOnTime, isOverdue } from './request-due';
import type { RequestSummaryRow } from './request-view';

/** What the board asks for: the type and the search narrow every column, the limit caps each one. */
export interface RequestBoardQuery {
  type?: RequestSummaryRow['type'];
  q?: string;
  limit: number;
}

export function toBoardCard(row: RequestSummaryRow, now: Date): RequestBoardCard {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    personName: row.personName,
    status: row.status,
    dueAt: row.dueAt.toISOString(),
    overdue: isOverdue({ status: row.status, dueAt: row.dueAt, now }),
    closedAt: iso(row.closedAt),
    closedOnTime: closedOnTime(row),
    assigneeName: row.assignee?.name ?? null,
  };
}

/** The board from the rows each column returned and the head counts. */
export function requestBoard(
  columns: Record<RequestStatus, RequestSummaryRow[]>,
  counts: RequestCounts,
  now: Date,
): RequestBoardResponse {
  const cards = (status: RequestStatus) => columns[status].map((row) => toBoardCard(row, now));
  return {
    new: cards('new'),
    in_progress: cards('in_progress'),
    done: cards('done'),
    counts,
  };
}
