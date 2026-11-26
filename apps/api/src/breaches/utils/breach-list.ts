import type {
  BreachCounts,
  BreachListItem,
  BreachListResponse,
  BreachTab,
} from '@neeti-bharat/shared';
import { stateOf, toListItem, type BreachSummaryRow, type Clock } from './breach-view';

export interface BreachListQuery {
  tab: BreachTab;
  page: number;
  limit: number;
}

const isClosed = (item: BreachListItem): boolean => item.closedAt !== null;

/** Open breaches: late ones first, then the one found longest ago. Closed breaches: the latest closed first. */
const byUrgency = (a: BreachListItem, b: BreachListItem): number =>
  Number(b.overdue) - Number(a.overdue) || a.foundAt.localeCompare(b.foundAt);

const byClosedAt = (a: BreachListItem, b: BreachListItem): number =>
  (b.closedAt ?? '').localeCompare(a.closedAt ?? '');

/** The head counts for every breach, whatever the tab, page or search. */
export function breachCounts(all: BreachSummaryRow[], clock: Clock): BreachCounts {
  const states = all.map((row) => stateOf(row, clock));
  return {
    open: states.filter((state) => state.closedAt === null).length,
    closed: states.filter((state) => state.closedAt !== null).length,
    overdue: states.filter((state) => state.overdue).length,
  };
}

/**
 * One page of the list. `matching` is what the search matched; `all` is every breach, for the counts that do
 * not move with the search.
 */
export function breachList(
  matching: BreachSummaryRow[],
  all: BreachSummaryRow[],
  query: BreachListQuery,
  clock: Clock,
): BreachListResponse {
  const onTab = matching
    .map((row) => toListItem(row, clock))
    .filter((item) => isClosed(item) === (query.tab === 'closed'))
    .sort(query.tab === 'closed' ? byClosedAt : byUrgency);
  const start = (query.page - 1) * query.limit;
  return {
    items: onTab.slice(start, start + query.limit),
    total: onTab.length,
    page: query.page,
    pageSize: query.limit,
    counts: breachCounts(all, clock),
  };
}
