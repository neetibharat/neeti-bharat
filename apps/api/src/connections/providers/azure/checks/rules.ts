import type { AzureApi } from '../azure-api';
import { nameOf, type Named } from './azure-lists';
import { judge, type AzureCheck, type Verdict } from './outcome';

/**
 * A check made of one rule about one kind of resource: list them all, judge each, and name the ones that are not fine.
 * Most of what is checked is exactly this, so each is a line that says what to look for.
 */
export function rule<T extends Named>(
  id: AzureCheck['id'],
  list: (api: AzureApi, subscriptionId: string) => Promise<T[]>,
  verdict: (item: T) => Verdict,
): AzureCheck {
  return {
    id,
    run: async (api, subscriptionId) => judge(await list(api, subscriptionId), verdict, nameOf),
  };
}

/** The oldest version of TLS a server accepts, written as `1.2` or `TLS1_2`: it is weak below 1.2. */
export function weakTlsVersion(version?: string): boolean {
  if (version === undefined || version === '') return false;
  const number = Number.parseFloat(version.replace(/^tls/i, '').replace('_', '.'));
  return Number.isNaN(number) || number < 1.2;
}
