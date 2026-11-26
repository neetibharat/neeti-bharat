import {
  CONNECTION_NAMES_SHOWN,
  CONNECTION_RESOURCES_KEPT,
  type ConnectionCheckResult,
  type FlaggedResource,
  type FoundValue,
} from '@neeti-bharat/shared';

/** What a check found. The runner adds the check's id. */
export type Outcome = Omit<ConnectionCheckResult, 'id'>;

export type Verdict = 'ok' | 'warn' | 'fail';

/** The settings a check read. A setting the system left out is `undefined`, and is kept as not set. */
export type Found = Record<string, FoundValue | undefined>;

/** A resource as a check names it: its name, and where it is and what was seen on it, when the check knows. */
export interface Described {
  name: string;
  location?: string;
  group?: string;
  url?: string;
  found?: Found;
}

export const nothingToCheck: Outcome = { status: 'skipped', reason: 'none' };

const notSet = (found: Found): Record<string, FoundValue> =>
  Object.fromEntries(Object.entries(found).map(([key, value]) => [key, value ?? null]));

function flagged(described: Described, status: 'warn' | 'fail'): FlaggedResource {
  const { name, location, group, url, found } = described;
  return {
    name,
    status,
    ...(location && { location }),
    ...(group && { group }),
    ...(url && { url }),
    ...(found && { found: notSet(found) }),
  };
}

/**
 * Judges a list of things one by one. All fine is a pass; any fail makes the check a fail, and otherwise a warning.
 * `describe` says what to call a thing that is not fine, and what was seen on it, or nothing, for things that should not
 * be named, such as people.
 */
export function judge<T>(
  items: readonly T[],
  verdict: (item: T) => Verdict,
  describe?: (item: T) => string | Described,
): Outcome {
  if (items.length === 0) return nothingToCheck;
  const flaggedItems = items.filter((item) => verdict(item) !== 'ok');
  if (flaggedItems.length === 0) return { status: 'pass', values: { total: items.length } };
  const values: Record<string, string | number> = {
    count: flaggedItems.length,
    total: items.length,
  };
  const failed = flaggedItems.some((item) => verdict(item) === 'fail');
  const status = failed ? 'fail' : 'warn';
  if (!describe) return { status, values };
  const named = flaggedItems.map((item) => {
    const described = describe(item);
    return typeof described === 'string' ? { name: described } : described;
  });
  values.names = named
    .slice(0, CONNECTION_NAMES_SHOWN)
    .map(({ name }) => name)
    .join(', ');
  // Every one that did not pass is kept, up to a limit, so its own page can list them all and say how each did.
  const resources = named
    .slice(0, CONNECTION_RESOURCES_KEPT)
    .map((described, index) =>
      flagged(described, verdict(flaggedItems[index]!) as 'warn' | 'fail'),
    );
  return { status, values, resources };
}

/** How many checks ended each way. */
export function tally(results: readonly ConnectionCheckResult[]) {
  const count = (status: ConnectionCheckResult['status']) =>
    results.filter((result) => result.status === status).length;
  return {
    passed: count('pass'),
    warned: count('warn'),
    failed: count('fail'),
    skipped: count('skipped'),
  };
}
