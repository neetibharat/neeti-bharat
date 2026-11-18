import {
  CHECK_SEVERITY,
  CHECK_SEVERITIES,
  type CheckSeverity,
  type ConnectionCheckResult,
} from '@dpdp-kit/shared';
import { inView, type ResultView } from './connections';

export type SeverityFilter = CheckSeverity | 'all';

export interface ResultFilter {
  view: ResultView;
  severity: SeverityFilter;
  /** Says whether a check matches what was typed in the search box. */
  matches: (id: ConnectionCheckResult['id']) => boolean;
}

const WEIGHT: Record<CheckSeverity, number> = { high: 0, medium: 1, low: 2 };

/** How many of these results are at each severity. Pass the ones the current view lists, so the counts match it. */
export function countBySeverity(
  results: readonly ConnectionCheckResult[],
): Record<CheckSeverity, number> {
  const counts = Object.fromEntries(CHECK_SEVERITIES.map((level) => [level, 0])) as Record<
    CheckSeverity,
    number
  >;
  for (const result of results) counts[CHECK_SEVERITY[result.id]]++;
  return counts;
}

/** The results to show: failures before warnings, and within each the more serious checks first. */
export function visibleResults(
  results: readonly ConnectionCheckResult[],
  filter: ResultFilter,
): ConnectionCheckResult[] {
  return inView(results, filter.view)
    .filter((result) => filter.severity === 'all' || CHECK_SEVERITY[result.id] === filter.severity)
    .filter((result) => filter.matches(result.id))
    .sort(
      (a, b) =>
        statusRank(a) - statusRank(b) ||
        WEIGHT[CHECK_SEVERITY[a.id]] - WEIGHT[CHECK_SEVERITY[b.id]],
    );
}

const statusRank = (result: ConnectionCheckResult): number =>
  ({ fail: 0, warn: 1, pass: 2, skipped: 3 })[result.status];
