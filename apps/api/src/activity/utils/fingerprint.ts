import { createHash } from 'node:crypto';

export interface FingerprintInput {
  occurredAt: Date;
  actorId: string | null;
  actorLabel: string;
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  details: unknown;
  before: unknown;
  after: unknown;
}

/** JSON with its keys in a fixed order, so the same event always gives the same text. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, member]) => member !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${stableStringify(member)}`).join(',')}}`;
}

/**
 * The fingerprint of an event: a hash of the event and of the fingerprint before it.
 * Change or remove any earlier event and every fingerprint after it stops matching.
 */
export function fingerprint(previous: string | null, event: FingerprintInput): string {
  // Name each field: a database row also carries id, seq and the hashes, and those must not count.
  const body = stableStringify({
    occurredAt: event.occurredAt.toISOString(),
    actorId: event.actorId,
    actorLabel: event.actorLabel,
    action: event.action,
    subjectType: event.subjectType,
    subjectId: event.subjectId,
    details: event.details,
    before: event.before,
    after: event.after,
  });
  return createHash('sha256')
    .update(
      `${previous ?? ''}
${body}`,
    )
    .digest('hex');
}
