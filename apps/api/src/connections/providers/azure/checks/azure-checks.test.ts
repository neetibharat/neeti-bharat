import { AZURE_CHECK_IDS } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import {
  dataInIndia,
  keyVaultProtection,
  sqlAuditing,
  sqlPublicAccess,
  sqlTls,
  storagePublicAccess,
  storageSecureTransfer,
} from './data-checks';
import { adminCount, mfaEnforced, mfaRegistered } from './entra-checks';
import { AZURE_CHECKS } from './index';
import { fakeAzure } from './fake-azure';
import { nsgOpenPorts } from './network-checks';

const SUB = '11111111-2222-3333-4444-555555555555';

describe('the list of checks', () => {
  it('has every check named in the shared list, in the same order', () => {
    expect(AZURE_CHECKS.map((check) => check.id)).toEqual([...AZURE_CHECK_IDS]);
  });
});

describe('entra_mfa_registered', () => {
  const run = (users: unknown[]) =>
    mfaRegistered.run(fakeAzure({ graph: { userRegistrationDetails: users } }), SUB);

  it('passes when every member has a second step', async () => {
    expect(await run([{ userType: 'member', isMfaRegistered: true }])).toMatchObject({
      status: 'pass',
      values: { total: 1 },
    });
  });

  it('fails when members have none, counts them, and never names them', async () => {
    const outcome = await run([
      { userType: 'member', isMfaRegistered: false },
      { userType: 'member', isMfaRegistered: true },
    ]);
    expect(outcome).toEqual({ status: 'fail', values: { count: 1, total: 2 } });
  });

  it('leaves guests out', async () => {
    expect(await run([{ userType: 'guest', isMfaRegistered: false }])).toEqual({
      status: 'skipped',
      reason: 'none',
    });
  });
});

describe('entra_mfa_enforced', () => {
  const run = (defaults: boolean, policies: unknown[]) =>
    mfaEnforced.run(
      fakeAzure({
        graph: {
          identitySecurityDefaultsEnforcementPolicy: { isEnabled: defaults },
          conditionalAccess: policies,
        },
      }),
      SUB,
    );
  const policy = (over: object) => ({
    state: 'enabled',
    grantControls: { builtInControls: ['mfa'] },
    conditions: { users: { includeUsers: ['All'] } },
    ...over,
  });

  it('passes with security defaults on', async () => {
    expect((await run(true, [])).status).toBe('pass');
  });

  it('passes with a policy that asks everyone for a second step', async () => {
    expect((await run(false, [policy({})])).status).toBe('pass');
  });

  it('fails with no such policy: switched off, or for some users only', async () => {
    expect((await run(false, [])).status).toBe('fail');
    expect((await run(false, [policy({ state: 'disabled' })])).status).toBe('fail');
    expect(
      (await run(false, [policy({ conditions: { users: { includeUsers: ['abc'] } } })])).status,
    ).toBe('fail');
  });
});

describe('entra_admin_count', () => {
  const run = (members: number, roleKnown = true) =>
    adminCount.run(
      fakeAzure({
        graph: {
          '/directoryRoles?': roleKnown
            ? [{ id: 'r1', roleTemplateId: '62e90394-69f5-4237-9190-012177145e10' }]
            : [],
          '/members': Array.from({ length: members }, (_, index) => ({ id: `u${index}` })),
        },
      }),
      SUB,
    );

  it('passes with two to five global administrators', async () => {
    expect(await run(3)).toEqual({ status: 'pass', values: { count: 3 } });
  });

  it('warns with one, or with many', async () => {
    expect((await run(1)).status).toBe('warn');
    expect((await run(9)).status).toBe('warn');
  });

  it('has nothing to say when the role is not in use', async () => {
    expect(await run(0, false)).toEqual({ status: 'skipped', reason: 'none' });
  });
});

const storage = (name: string, properties: object, location = 'centralindia') => ({
  name,
  location,
  properties,
});

describe('storage checks', () => {
  const api = (accounts: unknown[]) => fakeAzure({ arm: { 'Microsoft.Storage': accounts } });

  it('flag plain HTTP and old TLS, and name the accounts', async () => {
    const outcome = await storageSecureTransfer.run(
      api([
        storage('good', { supportsHttpsTrafficOnly: true, minimumTlsVersion: 'TLS1_2' }),
        storage('old', { supportsHttpsTrafficOnly: true, minimumTlsVersion: 'TLS1_0' }),
        storage('plain', { supportsHttpsTrafficOnly: false }),
      ]),
      SUB,
    );
    expect(outcome).toEqual({
      status: 'fail',
      values: { count: 2, total: 3, names: 'old, plain' },
    });
  });

  it('flag a public container setting', async () => {
    const outcome = await storagePublicAccess.run(
      api([
        storage('open', { allowBlobPublicAccess: true }),
        storage('shut', { allowBlobPublicAccess: false }),
      ]),
      SUB,
    );
    expect(outcome).toMatchObject({ status: 'fail', values: { count: 1, names: 'open' } });
  });

  it('have nothing to say when there are no accounts', async () => {
    expect(await storagePublicAccess.run(api([]), SUB)).toEqual({
      status: 'skipped',
      reason: 'none',
    });
  });

  it('list at most five names', async () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      storage(`s${index}`, { allowBlobPublicAccess: true }),
    );
    const outcome = await storagePublicAccess.run(api(many), SUB);
    expect(outcome.values).toMatchObject({ count: 8, names: 's0, s1, s2, s3, s4' });
  });
});

describe('keyvault_protection', () => {
  const run = (properties: object) =>
    keyVaultProtection.run(
      fakeAzure({
        arm: { 'Microsoft.KeyVault': [{ name: 'kv', location: 'centralindia', properties }] },
      }),
      SUB,
    );

  it('passes with soft delete and purge protection', async () => {
    expect((await run({ enableSoftDelete: true, enablePurgeProtection: true })).status).toBe(
      'pass',
    );
  });

  it('warns without purge protection, and fails without soft delete', async () => {
    expect((await run({ enableSoftDelete: true })).status).toBe('warn');
    expect((await run({ enableSoftDelete: false, enablePurgeProtection: true })).status).toBe(
      'fail',
    );
  });
});

describe('sql checks', () => {
  const server = (properties: object) => ({
    id: `/subscriptions/${SUB}/resourceGroups/rg/providers/Microsoft.Sql/servers/db1`,
    name: 'db1',
    location: 'centralindia',
    properties,
  });
  const api = (properties: object, state = 'Enabled') =>
    fakeAzure({
      arm: {
        'auditingSettings/default': { properties: { state } },
        'Microsoft.Sql/servers?': [server(properties)],
      },
    });

  it('sql_tls fails below 1.2 and passes at 1.2', async () => {
    expect((await sqlTls.run(api({ minimalTlsVersion: '1.0' }), SUB)).status).toBe('fail');
    expect((await sqlTls.run(api({ minimalTlsVersion: '1.2' }), SUB)).status).toBe('pass');
  });

  it('sql_public_access warns when the server is open to the public network', async () => {
    expect((await sqlPublicAccess.run(api({ publicNetworkAccess: 'Enabled' }), SUB)).status).toBe(
      'warn',
    );
    expect((await sqlPublicAccess.run(api({ publicNetworkAccess: 'Disabled' }), SUB)).status).toBe(
      'pass',
    );
  });

  it('sql_auditing reads each server and fails when auditing is off', async () => {
    expect((await sqlAuditing.run(api({}, 'Enabled'), SUB)).status).toBe('pass');
    expect(await sqlAuditing.run(api({}, 'Disabled'), SUB)).toMatchObject({
      status: 'fail',
      values: { names: 'db1' },
    });
  });
});

describe('data_in_india', () => {
  const run = (storageLocation: string) =>
    dataInIndia.run(
      fakeAzure({
        arm: {
          'Microsoft.Storage': [{ name: 'files', location: storageLocation }],
          'Microsoft.Sql': [{ name: 'db', location: 'centralindia' }],
          'Microsoft.KeyVault': [],
        },
      }),
      SUB,
    );

  it('passes when every store is in India', async () => {
    expect((await run('southindia')).status).toBe('pass');
  });

  it('warns about stores elsewhere, with where they are', async () => {
    expect(await run('westeurope')).toEqual({
      status: 'warn',
      values: { count: 1, total: 2, names: 'files (westeurope)' },
    });
  });

  it('is reported as no access when no kind of store can be read', async () => {
    const api = fakeAzure({ denied: ['Microsoft.'] });
    await expect(dataInIndia.run(api, SUB)).rejects.toThrow();
  });
});

describe('nsg_open_ports', () => {
  const rule = (over: object) => ({
    properties: {
      direction: 'Inbound',
      access: 'Allow',
      sourceAddressPrefix: '*',
      destinationPortRange: '22',
      ...over,
    },
  });
  const run = (...rules: object[]) =>
    nsgOpenPorts.run(
      fakeAzure({
        arm: { networkSecurityGroups: [{ name: 'web', properties: { securityRules: rules } }] },
      }),
      SUB,
    );

  it('fails when the internet can reach a login or database port', async () => {
    expect((await run(rule({}))).status).toBe('fail');
    expect((await run(rule({ destinationPortRange: '3389' }))).status).toBe('fail');
    expect((await run(rule({ destinationPortRange: '*' }))).status).toBe('fail');
    expect((await run(rule({ destinationPortRange: '3000-3500' }))).status).toBe('fail');
    expect(
      (
        await run(
          rule({
            sourceAddressPrefix: 'Internet',
            destinationPortRange: undefined,
            destinationPortRanges: ['80', '5432'],
          }),
        )
      ).status,
    ).toBe('fail');
  });

  it('passes for web ports, other sources, outbound rules and denials', async () => {
    expect((await run(rule({ destinationPortRange: '443' }))).status).toBe('pass');
    expect((await run(rule({ sourceAddressPrefix: '10.0.0.0/8' }))).status).toBe('pass');
    expect((await run(rule({ direction: 'Outbound' }))).status).toBe('pass');
    expect((await run(rule({ access: 'Deny' }))).status).toBe('pass');
  });
});
