import {
  belongsTo,
  cosmosAccounts,
  disks,
  fulfilled,
  keyVaults,
  mongoClusters,
  mysqlServers,
  postgresServers,
  readable,
  redisCaches,
  refusedAmong,
  sqlServers,
  storageAccounts,
  MAX_ONE_BY_ONE,
  type Named,
} from './azure-lists';
import { judge, type AzureCheck, type Verdict } from './outcome';
import { rule, weakTlsVersion } from './rules';

/** Plain HTTP, or a version of TLS older than 1.2, is refused. */
export const storageSecureTransfer = rule(
  'storage_secure_transfer',
  storageAccounts,
  ({ properties }): Verdict =>
    properties?.supportsHttpsTrafficOnly === false || weakTlsVersion(properties?.minimumTlsVersion)
      ? 'fail'
      : 'ok',
);

/** Nothing in a container can be read by anyone who has only the address. */
export const storagePublicAccess = rule(
  'storage_public_access',
  storageAccounts,
  ({ properties }): Verdict => (properties?.allowBlobPublicAccess === true ? 'fail' : 'ok'),
);

/** Open to every network is a warning, not a failure: it is Azure's default, and what is inside may still need a key. */
export const storageNetworkAccess = rule(
  'storage_network_access',
  storageAccounts,
  ({ properties }): Verdict =>
    properties?.networkAcls?.defaultAction === 'Allow' &&
    properties?.publicNetworkAccess !== 'Disabled'
      ? 'warn'
      : 'ok',
);

/** A deleted vault or key can be recovered. */
export const keyVaultSoftDelete = rule(
  'keyvault_soft_delete',
  keyVaults,
  ({ properties }): Verdict => (properties?.enableSoftDelete === false ? 'fail' : 'ok'),
);

/** A deleted vault or key cannot be destroyed for good, by mistake or by someone who has got in, before its time. */
export const keyVaultPurgeProtection = rule(
  'keyvault_purge_protection',
  keyVaults,
  ({ properties }): Verdict => (properties?.enablePurgeProtection === true ? 'ok' : 'warn'),
);

export const keyVaultPublicAccess = rule(
  'keyvault_public_access',
  keyVaults,
  ({ properties }): Verdict =>
    properties?.publicNetworkAccess !== 'Disabled' &&
    properties?.networkAcls?.defaultAction !== 'Deny'
      ? 'warn'
      : 'ok',
);

/** Access is given by Azure roles, which are reviewed in one place, and not by access policies kept on each vault. */
export const keyVaultRbac = rule('keyvault_rbac', keyVaults, ({ properties }): Verdict =>
  properties?.enableRbacAuthorization === true ? 'ok' : 'warn',
);

export const sqlTls = rule('sql_tls', sqlServers, ({ properties }): Verdict =>
  weakTlsVersion(properties?.minimalTlsVersion) ? 'fail' : 'ok',
);

/** Open to the public internet is a warning, not a failure: firewall rules may still keep it closed. */
export const sqlPublicAccess = rule('sql_public_access', sqlServers, ({ properties }): Verdict =>
  properties?.publicNetworkAccess === 'Enabled' ? 'warn' : 'ok',
);

interface FirewallRule {
  properties?: { startIpAddress?: string; endIpAddress?: string };
}

const covers = ({ properties }: FirewallRule, from: string, to: string): boolean =>
  properties?.startIpAddress === from && properties?.endIpAddress === to;

/** Every address is a failure. Every Azure service, which includes other people's, is a warning. */
function firewallVerdict(rules: FirewallRule[]): Verdict {
  if (rules.some((entry) => covers(entry, '0.0.0.0', '255.255.255.255'))) return 'fail';
  return rules.some((entry) => covers(entry, '0.0.0.0', '0.0.0.0')) ? 'warn' : 'ok';
}

/** Each SQL server's firewall rules. A server the app may not read is reported as no access, not as a failure. */
export const sqlFirewall: AzureCheck = {
  id: 'sql_firewall',
  run: async (api, subscriptionId) => {
    const servers = (await sqlServers(api, subscriptionId))
      .filter((server) => belongsTo(server, subscriptionId))
      .slice(0, MAX_ONE_BY_ONE);
    const read = await Promise.allSettled(
      servers.map(async (server) => ({
        server,
        rules: await api.arm.list<FirewallRule>(
          `${server.id}/firewallRules?api-version=2021-11-01`,
        ),
      })),
    );
    refusedAmong(read);
    return judge(
      fulfilled(read),
      ({ rules }) => firewallVerdict(rules),
      ({ server }) => server.name,
    );
  },
};

/** Reads each server's auditing setting. A server the app may not read is reported as no access, not as a failure. */
export const sqlAuditing: AzureCheck = {
  id: 'sql_auditing',
  run: async (api, subscriptionId) => {
    const servers = (await sqlServers(api, subscriptionId))
      .filter((server) => belongsTo(server, subscriptionId))
      .slice(0, MAX_ONE_BY_ONE);
    const states = await Promise.all(
      servers.map(async (server) => {
        const setting = await api.arm.get<{ properties?: { state?: string } }>(
          `${server.id}/auditingSettings/default?api-version=2021-11-01`,
        );
        return { server, on: setting.properties?.state === 'Enabled' };
      }),
    );
    return judge(
      states,
      ({ on }): Verdict => (on ? 'ok' : 'fail'),
      ({ server }) => server.name,
    );
  },
};

const INDIA = new Set([
  'centralindia',
  'southindia',
  'westindia',
  'jioindiawest',
  'jioindiacentral',
]);

/**
 * Where the data stores are: storage accounts, SQL, PostgreSQL and MySQL servers, MongoDB, Redis and Cosmos DB,
 * managed disks and key vaults. DPDP lets personal data go abroad unless the government restricts a country, so this
 * is a warning to know about, not a failure. A kind the app may not read is left out, unless none can be read.
 */
export const dataInIndia: AzureCheck = {
  id: 'data_in_india',
  run: async (api, subscriptionId) => {
    const lists = await Promise.allSettled<Named[]>(
      [
        storageAccounts,
        sqlServers,
        postgresServers,
        mysqlServers,
        mongoClusters,
        redisCaches,
        cosmosAccounts,
        disks,
        keyVaults,
      ].map((list) => list(api, subscriptionId)),
    );
    return judge(
      readable(lists),
      ({ location }): Verdict => (INDIA.has((location ?? '').toLowerCase()) ? 'ok' : 'warn'),
      ({ name, location }) => `${name} (${location ?? '?'})`,
    );
  },
};
