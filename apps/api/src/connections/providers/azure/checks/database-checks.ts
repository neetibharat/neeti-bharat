import type { AzureApi } from '../azure-api';
import {
  MAX_ONE_BY_ONE,
  MYSQL_API_VERSION,
  POSTGRES_API_VERSION,
  belongsTo,
  cosmosAccounts,
  described,
  fulfilled,
  mongoClusters,
  mysqlServers,
  postgresServers,
  readable,
  redisCaches,
  refusedAmong,
  type PublicNetworkResource,
} from './azure-lists';
import { judge, type AzureCheck, type Found, type Verdict } from './outcome';
import { rule } from './rules';

type Engine = 'postgres' | 'mysql';

interface Setting {
  properties?: { value?: string };
}

const SECURE_TLS = new Set(['tlsv1.2', 'tlsv1.3']);

/** Whether a list of protocols, as MySQL writes it (`TLSv1.2, TLSv1.3`), holds nothing older than 1.2. */
const onlyModernTls = (value: string): boolean =>
  value.split(',').every((protocol) => SECURE_TLS.has(protocol.trim().toLowerCase()));

/** The server parameters that say whether it insists on encrypted connections, and on TLS 1.2 or newer. */
async function tlsSettings(
  api: AzureApi,
  server: PublicNetworkResource,
  engine: Engine,
): Promise<{ secure: boolean; found: Found }> {
  const version = engine === 'postgres' ? POSTGRES_API_VERSION : MYSQL_API_VERSION;
  const protocol = engine === 'postgres' ? 'ssl_min_protocol_version' : 'tls_version';
  const read = (name: string) =>
    api.arm.get<Setting>(`${server.id}/configurations/${name}?api-version=${version}`);
  const [transport, tls] = await Promise.all([read('require_secure_transport'), read(protocol)]);
  const required = transport.properties?.value;
  const versions = tls.properties?.value;
  return {
    secure: required?.toLowerCase() === 'on' && onlyModernTls(versions ?? ''),
    found: { require_secure_transport: required, [protocol]: versions },
  };
}

/**
 * Each PostgreSQL and MySQL flexible server's own parameters. A server that cannot be read for another reason, such as
 * one that is stopped, is left out; one the app is not allowed to read is reported as no access.
 */
export const flexibleServersTls: AzureCheck = {
  id: 'flexible_servers_tls',
  run: async (api, subscriptionId) => {
    const [postgres, mysql] = await Promise.allSettled([
      postgresServers(api, subscriptionId),
      mysqlServers(api, subscriptionId),
    ]);
    const servers = [
      ...fulfilled([postgres])
        .flat()
        .map((server) => ({ server, engine: 'postgres' as const })),
      ...fulfilled([mysql])
        .flat()
        .map((server) => ({ server, engine: 'mysql' as const })),
    ]
      .filter(({ server }) => belongsTo(server, subscriptionId))
      .slice(0, MAX_ONE_BY_ONE);
    if (servers.length === 0) readable([postgres, mysql]);
    const read = await Promise.allSettled(
      servers.map(async ({ server, engine }) => ({
        server,
        ...(await tlsSettings(api, server, engine)),
      })),
    );
    refusedAmong(read);
    return judge(
      fulfilled(read),
      ({ secure }): Verdict => (secure ? 'ok' : 'fail'),
      ({ server, found }) => described(server, found),
    );
  },
};

const publicAccessOf = ({ properties }: PublicNetworkResource): string | undefined =>
  properties?.publicNetworkAccess ?? properties?.network?.publicNetworkAccess;

const opensToThePublic = ({ properties }: PublicNetworkResource): boolean =>
  properties?.publicNetworkAccess === 'Enabled' ||
  properties?.network?.publicNetworkAccess === 'Enabled';

/** PostgreSQL, MySQL, MongoDB, Redis and Cosmos DB: public network access is a warning, because firewall rules may still keep it closed. */
export const datastoresPublicAccess: AzureCheck = {
  id: 'datastores_public_access',
  run: async (api, subscriptionId) => {
    const lists = await Promise.allSettled<PublicNetworkResource[]>(
      [postgresServers, mysqlServers, mongoClusters, redisCaches, cosmosAccounts].map((list) =>
        list(api, subscriptionId),
      ),
    );
    return judge(
      readable(lists),
      (resource): Verdict => (opensToThePublic(resource) ? 'warn' : 'ok'),
      (resource) => described(resource, { publicNetworkAccess: publicAccessOf(resource) }),
    );
  },
};

/** A key that can read and write everything is a key that can be copied: access by sign-in can be taken back. */
export const cosmosKeyAccess = rule(
  'cosmos_key_access',
  cosmosAccounts,
  ({ properties }): Verdict => (properties?.disableLocalAuth === true ? 'ok' : 'warn'),
  ({ properties }) => ({ disableLocalAuth: properties?.disableLocalAuth }),
);

/** Only matters with more than one region: with one there is nowhere to fail over to. */
export const cosmosFailover = rule(
  'cosmos_failover',
  cosmosAccounts,
  ({ properties }): Verdict =>
    (properties?.locations?.length ?? 0) > 1 && properties?.enableAutomaticFailover !== true
      ? 'warn'
      : 'ok',
  ({ properties }) => ({
    regions: properties?.locations?.length ?? 0,
    enableAutomaticFailover: properties?.enableAutomaticFailover,
  }),
);

/** A week of backups, or continuous backup. */
const WEEK_IN_HOURS = 168;

export const cosmosBackup = rule(
  'cosmos_backup',
  cosmosAccounts,
  ({ properties }): Verdict => {
    const policy = properties?.backupPolicy;
    const hours = policy?.periodicModeProperties?.backupRetentionIntervalInHours;
    return policy?.type === 'Periodic' && hours !== undefined && hours < WEEK_IN_HOURS
      ? 'warn'
      : 'ok';
  },
  ({ properties }) => ({
    'backupPolicy.type': properties?.backupPolicy?.type,
    backupRetentionIntervalInHours:
      properties?.backupPolicy?.periodicModeProperties?.backupRetentionIntervalInHours,
  }),
);
