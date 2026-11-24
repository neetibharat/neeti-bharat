import { AZURE_CHECK_GROUPS, AZURE_CHECK_IDS } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import {
  webAppFtp,
  webAppHttps,
  webAppIdentity,
  webAppRemoteDebugging,
  webAppTls,
  vmIdentity,
  vmSecureBoot,
  vmSshPassword,
} from './app-checks';
import {
  acrAdminUser,
  acrAnonymousPull,
  acrContentTrust,
  acrPublicAccess,
  acrRetention,
  aksAad,
  aksAutoUpgrade,
  aksMonitoring,
  aksNetworkPolicy,
  aksPolicyAddon,
  aksPrivateApi,
  aksRbac,
} from './container-checks';
import {
  dataInIndia,
  keyVaultPublicAccess,
  keyVaultPurgeProtection,
  keyVaultRbac,
  keyVaultSoftDelete,
  sqlAuditing,
  sqlFirewall,
  sqlPublicAccess,
  sqlTls,
  storageNetworkAccess,
  storagePublicAccess,
  storageSecureTransfer,
} from './data-checks';
import {
  cosmosBackup,
  cosmosFailover,
  cosmosKeyAccess,
  datastoresPublicAccess,
  flexibleServersTls,
} from './database-checks';
import { adminCount, mfaEnforced, mfaRegistered } from './entra-checks';
import { fakeAzure } from './fake-azure';
import {
  defenderPlans,
  defenderRecommendations,
  environmentSeparation,
  monitorAlerts,
  monitorLogExport,
  policyAssignments,
} from './governance-checks';
import { AZURE_CHECKS } from './index';
import { nsgOpenPorts } from './network-checks';
import type { AzureCheck } from './outcome';
import { encryptionAtRest } from './protection-checks';
import { rbacPrivileged, rbacServicePrincipals, rbacWildcardRoles } from './rbac-checks';

const SUB = '11111111-2222-3333-4444-555555555555';
const idOf = (kind: string, name: string) =>
  `/subscriptions/${SUB}/resourceGroups/rg/providers/${kind}/${name}`;

describe('the list of checks', () => {
  it('has every check named in the shared list, in the same order', () => {
    expect(AZURE_CHECKS.map((check) => check.id)).toEqual([...AZURE_CHECK_IDS]);
  });

  it('puts every check in exactly one group', () => {
    const grouped = AZURE_CHECK_GROUPS.flatMap((group) => [...group.checks]);
    expect([...grouped].sort()).toEqual([...AZURE_CHECK_IDS].sort());
  });
});

/** Runs one check against a fake Azure that answers each path containing a key. */
const outcome = (
  check: AzureCheck,
  arm: Record<string, unknown>,
  graph: Record<string, unknown> = {},
) => check.run(fakeAzure({ arm, graph }), SUB);

describe('entra_mfa_registered', () => {
  const run = (users: unknown[]) => outcome(mfaRegistered, {}, { userRegistrationDetails: users });

  it('passes when every member has a second step', async () => {
    expect(await run([{ userType: 'member', isMfaRegistered: true }])).toMatchObject({
      status: 'pass',
      values: { total: 1 },
    });
  });

  it('fails when members have none, counts them, and never names them', async () => {
    const result = await run([
      { userType: 'member', isMfaRegistered: false },
      { userType: 'member', isMfaRegistered: true },
    ]);
    expect(result).toEqual({ status: 'fail', values: { count: 1, total: 2 } });
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
    outcome(
      mfaEnforced,
      {},
      {
        identitySecurityDefaultsEnforcementPolicy: { isEnabled: defaults },
        conditionalAccess: policies,
      },
    );
  const policy = (over: object) => ({
    state: 'enabled',
    grantControls: { builtInControls: ['mfa'] },
    conditions: { users: { includeUsers: ['All'] } },
    ...over,
  });

  it('passes with security defaults on, or with a policy that asks everyone', async () => {
    expect((await run(true, [])).status).toBe('pass');
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
  const run = (members: number, known = true) =>
    outcome(
      adminCount,
      {},
      {
        '/directoryRoles?': known
          ? [{ id: 'r1', roleTemplateId: '62e90394-69f5-4237-9190-012177145e10' }]
          : [],
        '/members': Array.from({ length: members }, (_, i) => ({ id: `u${i}` })),
      },
    );

  it('passes with two to five, warns outside that, and has nothing to say when the role is not in use', async () => {
    expect(await run(3)).toEqual({ status: 'pass', values: { count: 3 } });
    expect((await run(1)).status).toBe('warn');
    expect((await run(9)).status).toBe('warn');
    expect(await run(0, false)).toEqual({ status: 'skipped', reason: 'none' });
  });
});

describe('role-based access', () => {
  const OWNER = `/subscriptions/${SUB}/providers/Microsoft.Authorization/roleDefinitions/owner`;
  const CONTRIBUTOR = `/subscriptions/${SUB}/providers/Microsoft.Authorization/roleDefinitions/contributor`;
  const definitions = [
    { id: OWNER, properties: { roleName: 'Owner' } },
    { id: CONTRIBUTOR, properties: { roleName: 'Contributor' } },
  ];
  const grant = (role: string, principalType: string, scope = `/subscriptions/${SUB}`) => ({
    properties: { roleDefinitionId: role, principalType, scope },
  });
  const run = (check: AzureCheck, assignments: unknown[]) =>
    outcome(check, { roleAssignments: assignments, roleDefinitions: definitions });

  it('rbac_privileged counts owners over the whole subscription, and ignores narrower grants', async () => {
    const few = await run(rbacPrivileged, [
      grant(OWNER, 'User'),
      grant(OWNER, 'User', `${`/subscriptions/${SUB}`}/resourceGroups/x`),
    ]);
    expect(few).toEqual({ status: 'pass', values: { count: 1, limit: 5 } });
    const many = await run(
      rbacPrivileged,
      Array.from({ length: 6 }, () => grant(OWNER, 'User')),
    );
    expect(many.status).toBe('warn');
  });

  it('rbac_service_principals warns when an app holds broad power', async () => {
    expect(
      (await run(rbacServicePrincipals, [grant(CONTRIBUTOR, 'ServicePrincipal')])).status,
    ).toBe('warn');
    expect((await run(rbacServicePrincipals, [grant(CONTRIBUTOR, 'User')])).status).toBe('pass');
  });

  it('rbac_wildcard_roles fails a custom role that allows every action, and names it', async () => {
    const roles = (actions: string[]) => [
      { id: 'x', properties: { roleName: 'Wide', permissions: [{ actions }] } },
    ];
    expect(await outcome(rbacWildcardRoles, { roleDefinitions: roles(['*']) })).toMatchObject({
      status: 'fail',
      values: { names: 'Wide' },
    });
    expect(
      (await outcome(rbacWildcardRoles, { roleDefinitions: roles(['Microsoft.Storage/*/read']) }))
        .status,
    ).toBe('pass');
    expect(await outcome(rbacWildcardRoles, { roleDefinitions: [] })).toEqual({
      status: 'skipped',
      reason: 'none',
    });
  });
});

describe('storage', () => {
  const run = (check: AzureCheck, accounts: unknown[]) =>
    outcome(check, { 'Microsoft.Storage': accounts });
  const account = (name: string, properties: object) => ({
    name,
    location: 'centralindia',
    properties,
  });

  it('storage_secure_transfer flags plain HTTP and old TLS, and names the accounts', async () => {
    const result = await run(storageSecureTransfer, [
      account('good', { supportsHttpsTrafficOnly: true, minimumTlsVersion: 'TLS1_2' }),
      account('old', { supportsHttpsTrafficOnly: true, minimumTlsVersion: 'TLS1_0' }),
      account('plain', { supportsHttpsTrafficOnly: false }),
    ]);
    expect(result).toMatchObject({
      status: 'fail',
      values: { count: 2, total: 3, names: 'old, plain' },
    });
    // Every one that did not pass is kept, with how each did and the settings that decided it.
    expect(result.resources).toEqual([
      {
        name: 'old',
        status: 'fail',
        location: 'centralindia',
        found: { supportsHttpsTrafficOnly: true, minimumTlsVersion: 'TLS1_0' },
      },
      {
        name: 'plain',
        status: 'fail',
        location: 'centralindia',
        found: { supportsHttpsTrafficOnly: false, minimumTlsVersion: null },
      },
    ]);
  });

  it('gives a flagged resource its resource group and its page in the Azure portal', async () => {
    const id =
      '/subscriptions/sub/resourceGroups/rg-prod/providers/Microsoft.Storage/storageAccounts/open';
    const result = await run(storagePublicAccess, [
      { ...account('open', { allowBlobPublicAccess: true }), id },
    ]);
    expect(result.resources).toEqual([
      {
        name: 'open',
        status: 'fail',
        location: 'centralindia',
        group: 'rg-prod',
        url: `https://portal.azure.com/#resource${id}`,
        found: { allowBlobPublicAccess: true },
      },
    ]);
  });

  it('storage_public_access flags a public container setting', async () => {
    const result = await run(storagePublicAccess, [
      account('open', { allowBlobPublicAccess: true }),
      account('shut', { allowBlobPublicAccess: false }),
    ]);
    expect(result).toMatchObject({ status: 'fail', values: { count: 1, names: 'open' } });
  });

  it('storage_network_access warns when every network may connect, and passes when it is narrowed', async () => {
    expect(
      (await run(storageNetworkAccess, [account('a', { networkAcls: { defaultAction: 'Allow' } })]))
        .status,
    ).toBe('warn');
    expect(
      (await run(storageNetworkAccess, [account('a', { networkAcls: { defaultAction: 'Deny' } })]))
        .status,
    ).toBe('pass');
    expect(
      (
        await run(storageNetworkAccess, [
          account('a', {
            networkAcls: { defaultAction: 'Allow' },
            publicNetworkAccess: 'Disabled',
          }),
        ])
      ).status,
    ).toBe('pass');
  });

  it('have nothing to say when there are no accounts, and list at most five names', async () => {
    expect(await run(storagePublicAccess, [])).toEqual({ status: 'skipped', reason: 'none' });
    const many = Array.from({ length: 8 }, (_, i) =>
      account(`s${i}`, { allowBlobPublicAccess: true }),
    );
    expect((await run(storagePublicAccess, many)).values).toMatchObject({
      count: 8,
      names: 's0, s1, s2, s3, s4',
    });
  });
});

describe('the resources a result keeps', () => {
  it('keeps at most 200 of the resources that did not pass, and still counts all of them', async () => {
    const many = Array.from({ length: 250 }, (_, i) => ({
      name: `s${i}`,
      properties: { allowBlobPublicAccess: true },
    }));
    const result = await outcome(storagePublicAccess, { 'Microsoft.Storage': many });
    expect(result.values).toMatchObject({ count: 250, total: 250 });
    expect(result.resources).toHaveLength(200);
  });

  it('keeps no resources for a check that does not name them, such as people without a second step', async () => {
    const result = await outcome(
      mfaRegistered,
      {},
      { userRegistrationDetails: [{ userType: 'member', isMfaRegistered: false }] },
    );
    expect(result.resources).toBeUndefined();
  });
});

describe('key vaults', () => {
  const run = (check: AzureCheck, properties: object) =>
    outcome(check, {
      'Microsoft.KeyVault': [{ name: 'kv', location: 'centralindia', properties }],
    });

  it('soft delete fails when off, and purge protection warns when not on', async () => {
    expect((await run(keyVaultSoftDelete, { enableSoftDelete: false })).status).toBe('fail');
    expect((await run(keyVaultSoftDelete, { enableSoftDelete: true })).status).toBe('pass');
    expect((await run(keyVaultPurgeProtection, {})).status).toBe('warn');
    expect((await run(keyVaultPurgeProtection, { enablePurgeProtection: true })).status).toBe(
      'pass',
    );
  });

  it('public access warns unless it is switched off or the firewall denies by default', async () => {
    expect((await run(keyVaultPublicAccess, { publicNetworkAccess: 'Enabled' })).status).toBe(
      'warn',
    );
    expect((await run(keyVaultPublicAccess, { publicNetworkAccess: 'Disabled' })).status).toBe(
      'pass',
    );
    expect(
      (await run(keyVaultPublicAccess, { networkAcls: { defaultAction: 'Deny' } })).status,
    ).toBe('pass');
  });

  it('warns for a vault that keeps its own access policies', async () => {
    expect((await run(keyVaultRbac, { enableRbacAuthorization: false })).status).toBe('warn');
    expect((await run(keyVaultRbac, { enableRbacAuthorization: true })).status).toBe('pass');
  });
});

describe('SQL', () => {
  const server = (properties: object = {}) => ({
    id: idOf('Microsoft.Sql/servers', 'db1'),
    name: 'db1',
    location: 'centralindia',
    properties,
  });
  const run = (check: AzureCheck, properties: object, extra: Record<string, unknown> = {}) =>
    outcome(check, { ...extra, 'Microsoft.Sql/servers?': [server(properties)] });
  const firewall = (...ranges: [string, string][]) => ({
    firewallRules: ranges.map(([startIpAddress, endIpAddress]) => ({
      properties: { startIpAddress, endIpAddress },
    })),
  });

  it('sql_tls fails below 1.2 and sql_public_access warns when public', async () => {
    expect((await run(sqlTls, { minimalTlsVersion: '1.0' })).status).toBe('fail');
    expect((await run(sqlTls, { minimalTlsVersion: '1.2' })).status).toBe('pass');
    expect((await run(sqlPublicAccess, { publicNetworkAccess: 'Enabled' })).status).toBe('warn');
    expect((await run(sqlPublicAccess, { publicNetworkAccess: 'Disabled' })).status).toBe('pass');
  });

  it('sql_firewall fails for every address, warns for every Azure service, and passes for ranges', async () => {
    expect((await run(sqlFirewall, {}, firewall(['0.0.0.0', '255.255.255.255']))).status).toBe(
      'fail',
    );
    expect((await run(sqlFirewall, {}, firewall(['0.0.0.0', '0.0.0.0']))).status).toBe('warn');
    expect((await run(sqlFirewall, {}, firewall(['10.0.0.1', '10.0.0.9']))).status).toBe('pass');
    expect(
      (await run(sqlFirewall, {}, firewall(['0.0.0.0', '0.0.0.0'], ['0.0.0.0', '255.255.255.255'])))
        .status,
    ).toBe('fail');
  });

  it('sql_auditing reads each server and fails when auditing is off', async () => {
    const state = (value: string) => ({
      'auditingSettings/default': { properties: { state: value } },
    });
    expect((await run(sqlAuditing, {}, state('Enabled'))).status).toBe('pass');
    expect(await run(sqlAuditing, {}, state('Disabled'))).toMatchObject({
      status: 'fail',
      values: { names: 'db1' },
    });
  });
});

describe('flexible servers', () => {
  const pg = {
    id: idOf('Microsoft.DBforPostgreSQL/flexibleServers', 'pg1'),
    name: 'pg1',
    location: 'centralindia',
  };
  const my = {
    id: idOf('Microsoft.DBforMySQL/flexibleServers', 'my1'),
    name: 'my1',
    location: 'centralindia',
  };
  const run = (config: Record<string, unknown>) =>
    outcome(flexibleServersTls, {
      ...config,
      'Microsoft.DBforPostgreSQL/flexibleServers?': [pg],
      'Microsoft.DBforMySQL/flexibleServers?': [my],
    });
  const value = (v: string) => ({ properties: { value: v } });

  it('passes when both insist on encrypted connections and TLS 1.2 or newer', async () => {
    const result = await run({
      require_secure_transport: value('ON'),
      ssl_min_protocol_version: value('TLSv1.2'),
      tls_version: value('TLSv1.2, TLSv1.3'),
    });
    expect(result).toEqual({ status: 'pass', values: { total: 2 } });
  });

  it('fails for a server that allows older TLS or unencrypted connections, and says which kind', async () => {
    const result = await run({
      require_secure_transport: value('on'),
      ssl_min_protocol_version: value('TLSv1.2'),
      tls_version: value('TLSv1, TLSv1.2'),
    });
    expect(result).toMatchObject({ status: 'fail', values: { count: 1, names: 'my1' } });
    const off = await run({
      require_secure_transport: value('off'),
      ssl_min_protocol_version: value('TLSv1.2'),
      tls_version: value('TLSv1.2'),
    });
    expect(off).toMatchObject({ status: 'fail', values: { count: 2 } });
  });

  it('has nothing to say with no servers', async () => {
    expect(
      await outcome(flexibleServersTls, {
        'Microsoft.DBforPostgreSQL/flexibleServers?': [],
        'Microsoft.DBforMySQL/flexibleServers?': [],
      }),
    ).toEqual({ status: 'skipped', reason: 'none' });
  });
});

describe('datastores_public_access', () => {
  it('warns about PostgreSQL, MySQL, MongoDB, Redis and Cosmos DB that allow the public network', async () => {
    const result = await outcome(datastoresPublicAccess, {
      'Microsoft.DBforPostgreSQL': [
        { name: 'pg', properties: { network: { publicNetworkAccess: 'Enabled' } } },
        { name: 'pg2', properties: { network: { publicNetworkAccess: 'Disabled' } } },
      ],
      'Microsoft.DocumentDB/mongoClusters': [
        { name: 'mongo', properties: { publicNetworkAccess: 'Enabled' } },
      ],
      'Microsoft.Cache': [{ name: 'redis', properties: {} }],
    });
    expect(result).toMatchObject({
      status: 'warn',
      values: { count: 2, total: 4, names: 'pg, mongo' },
    });
  });
});

describe('cosmos', () => {
  const run = (check: AzureCheck, properties: object) =>
    outcome(check, {
      'Microsoft.DocumentDB/databaseAccounts': [
        { name: 'c1', location: 'centralindia', properties },
      ],
    });

  it('cosmos_key_access warns unless local auth is off', async () => {
    expect((await run(cosmosKeyAccess, {})).status).toBe('warn');
    expect((await run(cosmosKeyAccess, { disableLocalAuth: true })).status).toBe('pass');
  });

  it('cosmos_failover only matters with more than one region', async () => {
    expect((await run(cosmosFailover, { locations: [{}, {}] })).status).toBe('warn');
    expect(
      (await run(cosmosFailover, { locations: [{}, {}], enableAutomaticFailover: true })).status,
    ).toBe('pass');
    expect((await run(cosmosFailover, { locations: [{}] })).status).toBe('pass');
  });

  it('cosmos_backup warns for less than a week of periodic backups', async () => {
    const periodic = (hours: number) => ({
      backupPolicy: {
        type: 'Periodic',
        periodicModeProperties: { backupRetentionIntervalInHours: hours },
      },
    });
    expect((await run(cosmosBackup, periodic(8))).status).toBe('warn');
    expect((await run(cosmosBackup, periodic(168))).status).toBe('pass');
    expect((await run(cosmosBackup, { backupPolicy: { type: 'Continuous' } })).status).toBe('pass');
  });
});

describe('encryption_at_rest', () => {
  const run = (storage: object, diskType?: string, tde = 'Enabled') =>
    outcome(encryptionAtRest, {
      'transparentDataEncryption/current': { properties: { state: tde } },
      '/databases?': [
        { id: idOf('Microsoft.Sql/servers/db1/databases', 'app'), name: 'app' },
        { id: idOf('Microsoft.Sql/servers/db1/databases', 'master'), name: 'master' },
      ],
      'Microsoft.Storage': [{ name: 'files', properties: { encryption: { services: storage } } }],
      'Microsoft.Compute/disks': [
        { name: 'disk1', properties: { encryption: diskType ? { type: diskType } : undefined } },
      ],
      'Microsoft.Sql/servers?': [{ id: idOf('Microsoft.Sql/servers', 'db1'), name: 'db1' }],
    });

  it('passes when storage, disks and SQL databases are all encrypted, and skips the master database', async () => {
    const result = await run(
      { blob: { enabled: true }, file: { enabled: true } },
      'EncryptionAtRestWithPlatformKey',
    );
    expect(result).toEqual({ status: 'pass', values: { total: 3 } });
  });

  it('fails for whatever is not, and names it', async () => {
    const result = await run({ blob: { enabled: false } }, undefined, 'Disabled');
    expect(result).toMatchObject({
      status: 'fail',
      values: { count: 3, names: 'files, disk1, app' },
    });
  });
});

describe('data_in_india', () => {
  const run = (storageLocation: string) =>
    outcome(dataInIndia, {
      'Microsoft.Storage': [{ name: 'files', location: storageLocation }],
      'Microsoft.Sql/servers?': [{ name: 'db', location: 'centralindia' }],
      'Microsoft.KeyVault': [],
    });

  it('passes when every store is in India, and warns about the rest with where they are', async () => {
    expect((await run('southindia')).status).toBe('pass');
    expect(await run('westeurope')).toMatchObject({
      status: 'warn',
      values: { count: 1, total: 2, names: 'files (westeurope)' },
    });
  });

  it('is reported as no access when no kind of store can be read', async () => {
    await expect(dataInIndia.run(fakeAzure({ denied: ['Microsoft.'] }), SUB)).rejects.toThrow();
  });
});

describe('web apps', () => {
  const app = (properties: object = {}, identity?: object) => ({
    id: idOf('Microsoft.Web/sites', 'app1'),
    name: 'app1',
    properties,
    identity,
  });
  const run = (check: AzureCheck, site: object, config: object = {}) =>
    outcome(check, { 'config/web': { properties: config }, 'Microsoft.Web/sites?': [site] });

  it('webapp_https fails for an app that also accepts plain HTTP', async () => {
    expect((await run(webAppHttps, app({ httpsOnly: false }))).status).toBe('fail');
    expect((await run(webAppHttps, app({ httpsOnly: true }))).status).toBe('pass');
  });

  it('reads each app’s own settings for TLS, remote debugging and FTP', async () => {
    expect((await run(webAppTls, app(), { minTlsVersion: '1.0' })).status).toBe('fail');
    expect((await run(webAppTls, app(), { minTlsVersion: '1.2' })).status).toBe('pass');
    expect((await run(webAppRemoteDebugging, app(), { remoteDebuggingEnabled: true })).status).toBe(
      'fail',
    );
    expect(
      (await run(webAppRemoteDebugging, app(), { remoteDebuggingEnabled: false })).status,
    ).toBe('pass');
    expect((await run(webAppFtp, app(), { ftpsState: 'AllAllowed' })).status).toBe('fail');
    expect((await run(webAppFtp, app(), { ftpsState: 'FtpsOnly' })).status).toBe('pass');
  });

  it('webapp_identity warns for an app with no managed identity', async () => {
    expect((await run(webAppIdentity, app())).status).toBe('warn');
    expect((await run(webAppIdentity, app({}, { type: 'SystemAssigned' }))).status).toBe('pass');
  });
});

describe('virtual machines', () => {
  const run = (check: AzureCheck, vm: object) =>
    outcome(check, { 'Microsoft.Compute/virtualMachines': [{ name: 'vm1', ...vm }] });

  it('vm_identity warns without a managed identity', async () => {
    expect((await run(vmIdentity, {})).status).toBe('warn');
    expect((await run(vmIdentity, { identity: { type: 'SystemAssigned' } })).status).toBe('pass');
  });

  it('vm_ssh_password warns for a Linux machine that accepts a password, and ignores other machines', async () => {
    const linux = (disable?: boolean) => ({
      properties: { osProfile: { linuxConfiguration: { disablePasswordAuthentication: disable } } },
    });
    expect((await run(vmSshPassword, linux(false))).status).toBe('warn');
    expect((await run(vmSshPassword, linux(undefined))).status).toBe('warn');
    expect((await run(vmSshPassword, linux(true))).status).toBe('pass');
    expect((await run(vmSshPassword, { properties: { osProfile: {} } })).status).toBe('pass');
  });

  it('vm_secure_boot warns only when secure boot is explicitly off', async () => {
    const boot = (value?: boolean) => ({
      properties: { securityProfile: { uefiSettings: { secureBootEnabled: value } } },
    });
    expect((await run(vmSecureBoot, boot(false))).status).toBe('warn');
    expect((await run(vmSecureBoot, boot(true))).status).toBe('pass');
    expect((await run(vmSecureBoot, {})).status).toBe('pass');
  });
});

describe('Kubernetes clusters', () => {
  const run = (check: AzureCheck, properties: object) =>
    outcome(check, { 'Microsoft.ContainerService': [{ name: 'k1', properties }] });

  it('checks roles, work accounts, network policy and the control point', async () => {
    expect((await run(aksRbac, { enableRBAC: false })).status).toBe('fail');
    expect((await run(aksRbac, { enableRBAC: true })).status).toBe('pass');
    expect((await run(aksAad, {})).status).toBe('warn');
    expect((await run(aksAad, { aadProfile: {} })).status).toBe('pass');
    expect(
      (await run(aksNetworkPolicy, { networkProfile: { networkPolicy: 'calico' } })).status,
    ).toBe('pass');
    expect((await run(aksNetworkPolicy, {})).status).toBe('warn');
    expect((await run(aksPrivateApi, {})).status).toBe('warn');
    expect(
      (await run(aksPrivateApi, { apiServerAccessProfile: { enablePrivateCluster: true } })).status,
    ).toBe('pass');
    expect(
      (await run(aksPrivateApi, { apiServerAccessProfile: { authorizedIPRanges: ['1.2.3.4/32'] } }))
        .status,
    ).toBe('pass');
  });

  it('checks the policy add-on, upgrades and monitoring', async () => {
    expect(
      (await run(aksPolicyAddon, { addonProfiles: { azurepolicy: { enabled: true } } })).status,
    ).toBe('pass');
    expect((await run(aksPolicyAddon, {})).status).toBe('warn');
    expect(
      (await run(aksAutoUpgrade, { autoUpgradeProfile: { upgradeChannel: 'stable' } })).status,
    ).toBe('pass');
    expect(
      (await run(aksAutoUpgrade, { autoUpgradeProfile: { upgradeChannel: 'none' } })).status,
    ).toBe('warn');
    expect(
      (await run(aksMonitoring, { addonProfiles: { omsagent: { enabled: true } } })).status,
    ).toBe('pass');
    expect((await run(aksMonitoring, {})).status).toBe('warn');
  });
});

describe('container registries', () => {
  const run = (check: AzureCheck, registry: object) =>
    outcome(check, { 'Microsoft.ContainerRegistry': [{ name: 'acr1', ...registry }] });

  it('fails for the shared admin login and for anonymous pulls, and warns for public access', async () => {
    expect((await run(acrAdminUser, { properties: { adminUserEnabled: true } })).status).toBe(
      'fail',
    );
    expect((await run(acrAdminUser, { properties: { adminUserEnabled: false } })).status).toBe(
      'pass',
    );
    expect(
      (await run(acrAnonymousPull, { properties: { anonymousPullEnabled: true } })).status,
    ).toBe('fail');
    expect(
      (await run(acrPublicAccess, { properties: { publicNetworkAccess: 'Enabled' } })).status,
    ).toBe('warn');
  });

  it('asks for content trust and clean-up only of a Premium registry', async () => {
    const policies = {
      policies: { trustPolicy: { status: 'disabled' }, retentionPolicy: { status: 'disabled' } },
    };
    expect(
      (await run(acrContentTrust, { sku: { name: 'Basic' }, properties: policies })).status,
    ).toBe('pass');
    expect(
      (await run(acrContentTrust, { sku: { name: 'Premium' }, properties: policies })).status,
    ).toBe('warn');
    expect(
      (await run(acrRetention, { sku: { name: 'Premium' }, properties: policies })).status,
    ).toBe('warn');
    expect(
      (
        await run(acrRetention, {
          sku: { name: 'Premium' },
          properties: { policies: { retentionPolicy: { status: 'enabled' } } },
        })
      ).status,
    ).toBe('pass');
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
    outcome(nsgOpenPorts, {
      networkSecurityGroups: [{ name: 'web', properties: { securityRules: rules } }],
    });

  it('fails when the internet can reach a login or database port', async () => {
    for (const open of [
      {},
      { destinationPortRange: '3389' },
      { destinationPortRange: '*' },
      { destinationPortRange: '3000-3500' },
    ]) {
      expect((await run(rule(open))).status).toBe('fail');
    }
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

describe('monitoring and governance', () => {
  const alertFor = (operation: string, enabled = true) => ({
    properties: { enabled, condition: { allOf: [{ field: 'operationName', equals: operation }] } },
  });
  const ALL = [
    'Microsoft.Authorization/policyAssignments/write',
    'Microsoft.Security/securitySolutions/write',
    'Microsoft.Network/networkSecurityGroups/write',
    'Microsoft.Sql/servers/firewallRules/write',
  ];

  it('monitor_alerts passes with an alert for each watched change, and names those missing', async () => {
    expect(
      (await outcome(monitorAlerts, { activityLogAlerts: ALL.map((op) => alertFor(op)) })).status,
    ).toBe('pass');
    const result = await outcome(monitorAlerts, {
      activityLogAlerts: [alertFor(ALL[0]!), alertFor(ALL[1]!, false)],
    });
    expect(result).toMatchObject({ status: 'warn', values: { count: 3, total: 4 } });
    expect(String(result.values?.names)).toContain('Microsoft.Sql/servers/firewallRules/write');
  });

  it('monitor_log_export passes when the activity log goes somewhere, and warns when it goes nowhere', async () => {
    expect(
      (
        await outcome(monitorLogExport, {
          diagnosticSettings: [{ properties: { workspaceId: '/w' } }],
        })
      ).status,
    ).toBe('pass');
    expect(await outcome(monitorLogExport, { diagnosticSettings: [] })).toEqual({
      status: 'warn',
      values: { count: 0 },
    });
  });

  it('policy_assignments passes with at least one policy assigned', async () => {
    expect(await outcome(policyAssignments, { policyAssignments: [{}, {}] })).toEqual({
      status: 'pass',
      values: { count: 2 },
    });
    expect((await outcome(policyAssignments, { policyAssignments: [] })).status).toBe('warn');
  });

  it('defender_plans warns for plans that are off, and names them', async () => {
    const plans = [
      { name: 'VirtualMachines', properties: { pricingTier: 'Standard' } },
      { name: 'KeyVaults', properties: { pricingTier: 'Free' } },
    ];
    expect(await outcome(defenderPlans, { 'Microsoft.Security/pricings': plans })).toMatchObject({
      status: 'warn',
      values: { count: 1, total: 2, names: 'KeyVaults' },
    });
  });

  it('defender_recommendations fails for high severity, warns for the rest, and ignores the healthy', async () => {
    const item = (displayName: string, code: string, severity: string) => ({
      properties: { displayName, status: { code }, metadata: { severity } },
    });
    const result = await outcome(defenderRecommendations, {
      'Microsoft.Security/assessments': [
        item('A', 'Unhealthy', 'High'),
        item('B', 'Unhealthy', 'Low'),
        item('C', 'Healthy', 'High'),
      ],
    });
    expect(result).toMatchObject({ status: 'fail', values: { count: 2, total: 3, names: 'A, B' } });
    expect(result.resources).toEqual([
      { name: 'A', status: 'fail', found: { severity: 'High', resource: null } },
      { name: 'B', status: 'warn', found: { severity: 'Low', resource: null } },
    ]);
    expect(
      (
        await outcome(defenderRecommendations, {
          'Microsoft.Security/assessments': [item('B', 'Unhealthy', 'Low')],
        })
      ).status,
    ).toBe('warn');
  });

  it('environment_separation passes when production and non-production groups both exist', async () => {
    const groups = (...names: string[]) => ({ resourcegroups: names.map((name) => ({ name })) });
    expect(
      await outcome(environmentSeparation, groups('rg-shop-prod', 'rg-shop-dev', 'rg-shared')),
    ).toEqual({
      status: 'pass',
      values: { production: 1, nonProduction: 1, total: 3 },
    });
    expect((await outcome(environmentSeparation, groups('rg-shop-prod', 'rg-shared'))).status).toBe(
      'warn',
    );
    expect((await outcome(environmentSeparation, groups('rg-a', 'rg-b'))).status).toBe('warn');
  });
});
