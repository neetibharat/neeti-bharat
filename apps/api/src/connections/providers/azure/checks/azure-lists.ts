import { AzureAccessError, type AzureApi } from '../azure-api';
import { resourcesPath, type Described, type Found } from './outcome';

/** What every resource has: where it is, and what it is called. */
export interface Named {
  id?: string;
  name: string;
  location?: string;
}

export interface StorageAccount extends Named {
  properties?: {
    supportsHttpsTrafficOnly?: boolean;
    minimumTlsVersion?: string;
    allowBlobPublicAccess?: boolean;
    publicNetworkAccess?: string;
    networkAcls?: { defaultAction?: string };
    encryption?: { services?: { blob?: { enabled?: boolean }; file?: { enabled?: boolean } } };
  };
}

export interface KeyVault extends Named {
  properties?: {
    enableSoftDelete?: boolean;
    enablePurgeProtection?: boolean;
    enableRbacAuthorization?: boolean;
    publicNetworkAccess?: string;
    networkAcls?: { defaultAction?: string };
  };
}

export interface SqlServer extends Named {
  properties?: { minimalTlsVersion?: string; publicNetworkAccess?: string };
}

/** Flexible servers keep their network setting one level down. MongoDB, Redis and Cosmos keep it on the resource. */
export interface PublicNetworkResource extends Named {
  properties?: { publicNetworkAccess?: string; network?: { publicNetworkAccess?: string } };
}

export interface WebApp extends Named {
  identity?: { type?: string };
  properties?: { httpsOnly?: boolean };
}

export interface WebAppConfig {
  properties?: { minTlsVersion?: string; remoteDebuggingEnabled?: boolean; ftpsState?: string };
}

export interface Disk extends Named {
  properties?: { encryption?: { type?: string } };
}

export interface VirtualMachine extends Named {
  identity?: { type?: string };
  properties?: {
    osProfile?: { linuxConfiguration?: { disablePasswordAuthentication?: boolean } };
    securityProfile?: { uefiSettings?: { secureBootEnabled?: boolean } };
  };
}

export interface AksCluster extends Named {
  properties?: {
    enableRBAC?: boolean;
    aadProfile?: object;
    networkProfile?: { networkPolicy?: string };
    apiServerAccessProfile?: { enablePrivateCluster?: boolean; authorizedIPRanges?: string[] };
    addonProfiles?: Record<string, { enabled?: boolean } | undefined>;
    autoUpgradeProfile?: { upgradeChannel?: string };
    azureMonitorProfile?: { metrics?: { enabled?: boolean } };
  };
}

export interface ContainerRegistry extends Named {
  sku?: { name?: string };
  properties?: {
    adminUserEnabled?: boolean;
    publicNetworkAccess?: string;
    anonymousPullEnabled?: boolean;
    policies?: { trustPolicy?: { status?: string }; retentionPolicy?: { status?: string } };
  };
}

export interface CosmosAccount extends Named {
  properties?: {
    publicNetworkAccess?: string;
    disableLocalAuth?: boolean;
    enableAutomaticFailover?: boolean;
    locations?: unknown[];
    backupPolicy?: {
      type?: string;
      periodicModeProperties?: { backupRetentionIntervalInHours?: number };
    };
  };
}

export interface RoleAssignment {
  properties?: { roleDefinitionId?: string; scope?: string; principalType?: string };
}

export interface RoleDefinition {
  id?: string;
  properties?: { roleName?: string; permissions?: { actions?: string[] }[] };
}

export interface ResourceGroup {
  name: string;
  tags?: Record<string, string>;
}

export const POSTGRES_API_VERSION = '2024-08-01';
export const MYSQL_API_VERSION = '2023-12-30';
export const WEB_API_VERSION = '2023-12-01';

type Lister<T> = (api: AzureApi, sub: string) => Promise<T[]>;

const resources =
  <T>(kind: string, version: string): Lister<T> =>
  (api, sub) =>
    api.arm.list<T>(resourcesPath(sub, kind, version));

export const storageAccounts = resources<StorageAccount>(
  'Microsoft.Storage/storageAccounts',
  '2023-05-01',
);
export const keyVaults = resources<KeyVault>('Microsoft.KeyVault/vaults', '2023-07-01');
export const sqlServers = resources<SqlServer>('Microsoft.Sql/servers', '2021-11-01');
export const postgresServers = resources<PublicNetworkResource>(
  'Microsoft.DBforPostgreSQL/flexibleServers',
  POSTGRES_API_VERSION,
);
export const mysqlServers = resources<PublicNetworkResource>(
  'Microsoft.DBforMySQL/flexibleServers',
  MYSQL_API_VERSION,
);
export const mongoClusters = resources<PublicNetworkResource>(
  'Microsoft.DocumentDB/mongoClusters',
  '2024-07-01',
);
export const redisCaches = resources<PublicNetworkResource>(
  'Microsoft.Cache/redisEnterprise',
  '2024-10-01',
);
export const cosmosAccounts = resources<CosmosAccount>(
  'Microsoft.DocumentDB/databaseAccounts',
  '2024-05-15',
);
export const webApps = resources<WebApp>('Microsoft.Web/sites', WEB_API_VERSION);
export const disks = resources<Disk>('Microsoft.Compute/disks', '2023-10-02');
export const virtualMachines = resources<VirtualMachine>(
  'Microsoft.Compute/virtualMachines',
  '2024-03-01',
);
export const aksClusters = resources<AksCluster>(
  'Microsoft.ContainerService/managedClusters',
  '2024-05-01',
);
export const containerRegistries = resources<ContainerRegistry>(
  'Microsoft.ContainerRegistry/registries',
  '2023-07-01',
);

/**
 * Reads several kinds of resource where one kind the app may not read, or one that does not exist in the subscription,
 * must not hide the rest. A kind that cannot be read is left out, unless none can be.
 */
export function readable<T>(lists: PromiseSettledResult<T[]>[]): T[] {
  const items = lists.flatMap((list) => (list.status === 'fulfilled' ? list.value : []));
  const refused = lists.find((list): list is PromiseRejectedResult => list.status === 'rejected');
  if (items.length === 0 && refused) throw refused.reason ?? new AzureAccessError('No access');
  return items;
}

/** Throws the first refusal among several reads, so a check that cannot read part of what it needs says so. */
export function refusedAmong(results: PromiseSettledResult<unknown>[]): void {
  const denied = results.find(
    (result): result is PromiseRejectedResult =>
      result.status === 'rejected' && result.reason instanceof AzureAccessError,
  );
  if (denied) throw denied.reason;
}

/** The values of the reads that worked. */
export const fulfilled = <T>(results: PromiseSettledResult<T>[]): T[] =>
  results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));

/** A resource of this subscription, by the address Azure gave it, which is the only kind followed. */
export const belongsTo = (resource: Named, sub: string): boolean =>
  Boolean(resource.id?.startsWith(`/subscriptions/${sub}/`));

export const nameOf = (item: Named): string => item.name;

const PORTAL = 'https://portal.azure.com/#resource';

/** The resource group in a resource's address, such as `rg-prod` in `/subscriptions/…/resourceGroups/rg-prod/…`. */
export const groupOf = (id?: string): string | undefined =>
  id ? /\/resourceGroups\/([^/]+)/i.exec(id)?.[1] : undefined;

/** A resource with its region, its resource group, its page in the Azure portal, and the settings the check read. */
export function described(resource: Named, found?: Found): Described {
  return {
    name: resource.name,
    location: resource.location,
    group: groupOf(resource.id),
    url: resource.id ? `${PORTAL}${resource.id}` : undefined,
    found,
  };
}

/** The most resources read one by one, such as the settings of each web app. */
export const MAX_ONE_BY_ONE = 100;
