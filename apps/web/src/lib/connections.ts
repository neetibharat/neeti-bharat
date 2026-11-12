import type { ConnectionCheckResult } from '@dpdp-kit/shared';

/**
 * Which sentence of a result to show. A pass has its own, anything else that was found is "problem" (a warning or a
 * failure, which the badge tells apart), and a check that could not answer says why.
 */
export function outcomeKey(result: ConnectionCheckResult): string {
  if (result.status === 'pass') return 'pass';
  if (result.status === 'skipped') return `skipped.${result.reason ?? 'error'}`;
  return 'problem';
}

/** `attention` shows only what failed or needs a look; `all` shows every check, passed and not checked too. */
export type ResultView = 'attention' | 'all';

const URGENCY: Record<ConnectionCheckResult['status'], number> = {
  fail: 0,
  warn: 1,
  pass: 2,
  skipped: 3,
};

export const needsAttention = (result: ConnectionCheckResult): boolean =>
  result.status === 'fail' || result.status === 'warn';

/** The results a view shows, failures first, then what needs a look, then the rest. Equal ones keep their order. */
export function inView(
  results: readonly ConnectionCheckResult[],
  view: ResultView,
): ConnectionCheckResult[] {
  const shown = view === 'all' ? [...results] : results.filter(needsAttention);
  return shown.sort((a, b) => URGENCY[a.status] - URGENCY[b.status]);
}
