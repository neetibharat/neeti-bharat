import type { ConnectionCheckResult } from '@dpdp-kit/shared';
import { AzureAccessError, cached, type AzureApi } from './azure-api';
import { AZURE_CHECKS } from './checks';
import type { AzureCheck, Outcome } from './checks/outcome';

/** A check that cannot answer is reported as skipped, with the reason, and never stops the others. */
async function attempt(check: AzureCheck, api: AzureApi, subscriptionId: string): Promise<Outcome> {
  try {
    return await check.run(api, subscriptionId);
  } catch (error) {
    return { status: 'skipped', reason: error instanceof AzureAccessError ? 'access' : 'error' };
  }
}

/** Runs every check against one subscription. Reads are shared, so a list that two checks need is fetched once. */
export async function runAzureChecks(
  api: AzureApi,
  subscriptionId: string,
): Promise<ConnectionCheckResult[]> {
  const shared = cached(api);
  return Promise.all(
    AZURE_CHECKS.map(async (check) => ({
      id: check.id,
      ...(await attempt(check, shared, subscriptionId)),
    })),
  );
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
