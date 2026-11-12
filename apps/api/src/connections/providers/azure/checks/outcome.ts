import {
  CONNECTION_NAMES_SHOWN,
  CONNECTION_RESOURCES_KEPT,
  type ConnectionCheckResult,
} from '@dpdp-kit/shared';
import type { AzureApi } from '../azure-api';

/** What a check found. The runner adds the check's id. */
export type Outcome = Omit<ConnectionCheckResult, 'id'>;

export interface AzureCheck {
  id: ConnectionCheckResult['id'];
  run: (api: AzureApi, subscriptionId: string) => Promise<Outcome>;
}

export type Verdict = 'ok' | 'warn' | 'fail';

export const nothingToCheck: Outcome = { status: 'skipped', reason: 'none' };

/**
 * Judges a list of things one by one. All fine is a pass; any fail makes the check a fail, and otherwise a warning.
 * `name` says what to call a thing that is not fine, or nothing, for things that should not be named, such as people.
 */
export function judge<T>(
  items: readonly T[],
  verdict: (item: T) => Verdict,
  name?: (item: T) => string,
): Outcome {
  if (items.length === 0) return nothingToCheck;
  const flagged = items.filter((item) => verdict(item) !== 'ok');
  if (flagged.length === 0) return { status: 'pass', values: { total: items.length } };
  const values: Record<string, string | number> = { count: flagged.length, total: items.length };
  if (name) values.names = flagged.slice(0, CONNECTION_NAMES_SHOWN).map(name).join(', ');
  const failed = flagged.some((item) => verdict(item) === 'fail');
  const status = failed ? 'fail' : 'warn';
  if (!name) return { status, values };
  // Every one that did not pass is kept, up to a limit, so its own page can list them all and say how each did.
  const resources = flagged.slice(0, CONNECTION_RESOURCES_KEPT).map((item) => ({
    name: name(item),
    status: verdict(item) as 'warn' | 'fail',
  }));
  return { status, values, resources };
}

/** The path of a subscription's resources of one kind. */
export const resourcesPath = (subscriptionId: string, kind: string, apiVersion: string): string =>
  `/subscriptions/${subscriptionId}/providers/${kind}?api-version=${apiVersion}`;
