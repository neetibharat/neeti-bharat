import { AZURE_CHECK_IDS } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { fakeAzure } from './checks/fake-azure';
import { runAzureChecks, tally } from './run-azure-checks';

const SUB = '11111111-2222-3333-4444-555555555555';

describe('runAzureChecks', () => {
  it('gives one result for each check, in order, and a check that cannot answer does not stop the rest', async () => {
    const api = fakeAzure({
      arm: {
        'Microsoft.Storage': [],
        'Microsoft.KeyVault': [],
        'Microsoft.Sql': [],
        networkSecurityGroups: [],
      },
      // Everything in the directory is refused, as when no Graph permission has been given.
      denied: ['/v1.0/'],
    });
    const results = await runAzureChecks(api, SUB);
    expect(results.map((result) => result.id)).toEqual([...AZURE_CHECK_IDS]);
    const identity = results.filter((result) => result.id.startsWith('entra_'));
    expect(
      identity.every((result) => result.status === 'skipped' && result.reason === 'access'),
    ).toBe(true);
    expect(results.find((result) => result.id === 'nsg_open_ports')).toEqual({
      id: 'nsg_open_ports',
      status: 'skipped',
      reason: 'none',
    });
  });

  it('reports a check that failed for another reason as skipped, with the reason error', async () => {
    const results = await runAzureChecks(fakeAzure(), SUB);
    expect(
      results.every((result) => result.status === 'skipped' && result.reason === 'error'),
    ).toBe(true);
  });
});

describe('tally', () => {
  it('counts how many ended each way', () => {
    expect(
      tally([
        { id: 'sql_tls', status: 'pass' },
        { id: 'sql_auditing', status: 'fail' },
        { id: 'sql_public_access', status: 'warn' },
        { id: 'nsg_open_ports', status: 'skipped', reason: 'none' },
        { id: 'data_in_india', status: 'pass' },
      ]),
    ).toEqual({ passed: 2, warned: 1, failed: 1, skipped: 1 });
  });
});
