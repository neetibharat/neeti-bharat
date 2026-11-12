import { AzureAccessError } from '../azure-api';
import { judge, resourcesPath, type AzureCheck, type Verdict } from './outcome';

interface Named {
  id?: string;
  name: string;
  location?: string;
}

interface StorageAccount extends Named {
  properties?: {
    supportsHttpsTrafficOnly?: boolean;
    minimumTlsVersion?: string;
    allowBlobPublicAccess?: boolean;
  };
}

interface KeyVault extends Named {
  properties?: { enableSoftDelete?: boolean; enablePurgeProtection?: boolean };
}

interface SqlServer extends Named {
  properties?: { minimalTlsVersion?: string; publicNetworkAccess?: string };
}

const storageAccounts = (api: Parameters<AzureCheck['run']>[0], subscriptionId: string) =>
  api.arm.list<StorageAccount>(
    resourcesPath(subscriptionId, 'Microsoft.Storage/storageAccounts', '2023-05-01'),
  );
const keyVaults = (api: Parameters<AzureCheck['run']>[0], subscriptionId: string) =>
  api.arm.list<KeyVault>(resourcesPath(subscriptionId, 'Microsoft.KeyVault/vaults', '2023-07-01'));
const sqlServers = (api: Parameters<AzureCheck['run']>[0], subscriptionId: string) =>
  api.arm.list<SqlServer>(resourcesPath(subscriptionId, 'Microsoft.Sql/servers', '2021-11-01'));

const nameOf = (item: Named): string => item.name;

const OLD_TLS = new Set(['TLS1_0', 'TLS1_1']);

/** Plain HTTP, or a version of TLS older than 1.2, is refused. */
export const storageSecureTransfer: AzureCheck = {
  id: 'storage_secure_transfer',
  run: async (api, subscriptionId) =>
    judge(
      await storageAccounts(api, subscriptionId),
      ({ properties }): Verdict =>
        properties?.supportsHttpsTrafficOnly === false ||
        OLD_TLS.has(properties?.minimumTlsVersion ?? '')
          ? 'fail'
          : 'ok',
      nameOf,
    ),
};

/** Nothing in a container can be read by anyone who has only the address. */
export const storagePublicAccess: AzureCheck = {
  id: 'storage_public_access',
  run: async (api, subscriptionId) =>
    judge(
      await storageAccounts(api, subscriptionId),
      ({ properties }): Verdict => (properties?.allowBlobPublicAccess === true ? 'fail' : 'ok'),
      nameOf,
    ),
};

/** A deleted key can be recovered, and cannot be destroyed for good by mistake or by someone who has got in. */
export const keyVaultProtection: AzureCheck = {
  id: 'keyvault_protection',
  run: async (api, subscriptionId) =>
    judge(
      await keyVaults(api, subscriptionId),
      ({ properties }): Verdict => {
        if (properties?.enableSoftDelete === false) return 'fail';
        return properties?.enablePurgeProtection === true ? 'ok' : 'warn';
      },
      nameOf,
    ),
};

/** The oldest version of TLS the server accepts: 1.2, or newer. */
const weakTls = (version?: string): boolean => {
  if (version === undefined) return false;
  const number = Number.parseFloat(version);
  return Number.isNaN(number) || number < 1.2;
};

export const sqlTls: AzureCheck = {
  id: 'sql_tls',
  run: async (api, subscriptionId) =>
    judge(
      await sqlServers(api, subscriptionId),
      ({ properties }): Verdict => (weakTls(properties?.minimalTlsVersion) ? 'fail' : 'ok'),
      nameOf,
    ),
};

/** Open to the public internet is a warning, not a failure: firewall rules may still keep it closed. */
export const sqlPublicAccess: AzureCheck = {
  id: 'sql_public_access',
  run: async (api, subscriptionId) =>
    judge(
      await sqlServers(api, subscriptionId),
      ({ properties }): Verdict => (properties?.publicNetworkAccess === 'Enabled' ? 'warn' : 'ok'),
      nameOf,
    ),
};

/** The most servers whose auditing is read, one call each. */
const MAX_AUDITED = 50;

/** Reads each server's auditing setting. A server the app may not read is reported as no access, not as a failure. */
export const sqlAuditing: AzureCheck = {
  id: 'sql_auditing',
  run: async (api, subscriptionId) => {
    const servers = (await sqlServers(api, subscriptionId)).slice(0, MAX_AUDITED);
    const prefix = `/subscriptions/${subscriptionId}/`;
    const states = await Promise.all(
      servers.map(async (server) => {
        if (!server.id?.startsWith(prefix)) return { server, on: false };
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
 * Where the data stores are. DPDP lets personal data go abroad unless the government restricts a country, so this is a
 * warning to know about, not a failure. A kind of store the app may not read is left out, unless none can be read.
 */
export const dataInIndia: AzureCheck = {
  id: 'data_in_india',
  run: async (api, subscriptionId) => {
    const lists = await Promise.allSettled<Named[]>([
      storageAccounts(api, subscriptionId),
      sqlServers(api, subscriptionId),
      keyVaults(api, subscriptionId),
    ]);
    const readable = lists.flatMap((list) => (list.status === 'fulfilled' ? list.value : []));
    const refused = lists.find((list): list is PromiseRejectedResult => list.status === 'rejected');
    if (readable.length === 0 && refused) throw refused.reason ?? new AzureAccessError('No access');
    return judge(
      readable,
      ({ location }): Verdict => (INDIA.has((location ?? '').toLowerCase()) ? 'ok' : 'warn'),
      ({ name, location }) => `${name} (${location ?? '?'})`,
    );
  },
};
