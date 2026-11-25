import type { AzureApi } from '../azure-api';
import { described, type Named } from './azure-lists';
import { judge, type AzureCheck, type Found, type Verdict } from './outcome';

/**
 * A check made of one rule about one kind of resource: list them all, judge each, and name the ones that are not fine
 * with the settings that decided it. Most of what is checked is exactly this, so each says what to look for and what it
 * looked at.
 */
export function rule<T extends Named>(
  id: AzureCheck['id'],
  list: (api: AzureApi, subscriptionId: string) => Promise<T[]>,
  verdict: (item: T) => Verdict,
  found: (item: T) => Found,
): AzureCheck {
  return {
    id,
    run: async (api, subscriptionId) =>
      judge(await list(api, subscriptionId), verdict, (item) => described(item, found(item))),
  };
}

/** The oldest version of TLS a server accepts, written as `1.2` or `TLS1_2`: it is weak below 1.2. */
export function weakTlsVersion(version?: string): boolean {
  if (version === undefined || version === '') return false;
  const number = Number.parseFloat(version.replace(/^tls/i, '').replace('_', '.'));
  return Number.isNaN(number) || number < 1.2;
}
