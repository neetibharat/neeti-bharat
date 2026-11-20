import {
  EVIDENCE_NOTE_MAX_LENGTH,
  PROOF_CHECKS,
  type ConnectionCheckResult,
  type ConnectionProvider,
} from '@dpdp-kit/shared';

/** What has been accepted on a connection, as `acceptanceKey` gives it. */
export type Accepted = ReadonlySet<string>;

export const acceptanceKey = (checkId: string, resourceName: string): string =>
  `${checkId}\u0000${resourceName}`;

type Standing = 'passed' | 'accepted' | 'open';

/** How one result stands. Nothing of that kind to check is as good as a pass; a check that could not answer is open. */
function standing(result: ConnectionCheckResult, accepted: Accepted): Standing {
  if (result.status === 'pass') return 'passed';
  if (result.status === 'skipped') return result.reason === 'none' ? 'passed' : 'open';
  return flaggedStanding(result, accepted);
}

/** A warning or failure is accepted as a whole, or when every resource it lists is. */
function flaggedStanding(result: ConnectionCheckResult, accepted: Accepted): Standing {
  if (accepted.has(acceptanceKey(result.id, ''))) return 'accepted';
  const resources = result.resources ?? [];
  const total = Number(result.values?.count ?? resources.length);
  // A list cut short cannot show that everything on it was accepted.
  if (resources.length === 0 || resources.length < total) return 'open';
  return resources.every((r) => accepted.has(acceptanceKey(result.id, r.name)))
    ? 'accepted'
    : 'open';
}

export interface SnapshotNote {
  /** The note to keep on the proof. */
  text: string;
}

const SYSTEM: Record<ConnectionProvider, string> = { azure: 'Azure', github: 'GitHub' };

/** One line for each check behind a proof, and whether any of them found something to pass. Null when one is open. */
function judge(
  ids: readonly string[],
  results: ConnectionCheckResult[],
  accepted: Accepted,
): { lines: string[]; backed: boolean } | null {
  const lines: string[] = [];
  let backed = false;
  for (const id of ids) {
    const result = results.find((r) => r.id === id);
    const state = result ? standing(result, accepted) : 'open';
    if (state === 'open') return null;
    backed ||= result?.status === 'pass' || state === 'accepted';
    lines.push(`- ${id}: ${state === 'passed' ? 'passed' : 'flagged, accepted by a person'}`);
  }
  return { lines, backed };
}

/**
 * What a run says for one proof, or null when the run cannot back it: the proof is not one the system's checks stand
 * behind, a check behind it is open, or none of them found anything to pass. Only a run that holds up is kept.
 */
export function snapshotFor(
  proofId: string,
  connection: { name: string; provider: ConnectionProvider },
  results: ConnectionCheckResult[],
  accepted: Accepted,
  ranAt: Date,
): SnapshotNote | null {
  const ids = PROOF_CHECKS[proofId]?.[connection.provider] ?? [];
  const verdict = ids.length > 0 ? judge(ids, results, accepted) : null;
  if (!verdict?.backed) return null;
  const when = `${ranAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const head = `Automatic check of ${connection.name} (${SYSTEM[connection.provider]}) on ${when}. Every check behind this proof held up.`;
  return { text: [head, ...verdict.lines].join('\n').slice(0, EVIDENCE_NOTE_MAX_LENGTH) };
}
