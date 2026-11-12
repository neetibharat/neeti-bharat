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
