import type { CheckId, ConnectionCheckResult } from '@dpdp-kit/shared';

/**
 * The results of a run that read only some checks: the new ones, and the rest as the run before found them, each marked
 * with when it was read. Nothing is carried when there is no run before.
 */
export function carryOver(
  fresh: ConnectionCheckResult[],
  previous: { results: ConnectionCheckResult[]; ranAt: Date } | null,
): ConnectionCheckResult[] {
  if (!previous) return fresh;
  const read = new Map<CheckId, ConnectionCheckResult>(fresh.map((result) => [result.id, result]));
  const carried = previous.results.map(
    (result) =>
      read.get(result.id) ?? {
        ...result,
        checkedAt: result.checkedAt ?? previous.ranAt.toISOString(),
      },
  );
  const known = new Set(previous.results.map((result) => result.id));
  return [...carried, ...fresh.filter((result) => !known.has(result.id))];
}
