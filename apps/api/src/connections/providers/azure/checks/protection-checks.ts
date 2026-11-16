import type { AzureApi } from '../azure-api';
import {
  MAX_ONE_BY_ONE,
  belongsTo,
  disks,
  fulfilled,
  readable,
  refusedAmong,
  sqlServers,
  storageAccounts,
  type SqlServer,
  type StorageAccount,
} from './azure-lists';
import { judge, type AzureCheck, type Verdict } from './outcome';

interface Encrypted {
  name: string;
  on: boolean;
}

/** Transparent data encryption of each database, read one by one. The `master` database is the server's own. */
async function sqlEncryption(
  api: AzureApi,
  subscriptionId: string,
  servers: SqlServer[],
): Promise<Encrypted[]> {
  const lists = await Promise.all(
    servers
      .filter((server) => belongsTo(server, subscriptionId))
      .slice(0, MAX_ONE_BY_ONE)
      .map((server) =>
        api.arm.list<{ id: string; name: string }>(`${server.id}/databases?api-version=2021-11-01`),
      ),
  );
  const databases = lists
    .flat()
    .filter((db) => db.name !== 'master')
    .slice(0, MAX_ONE_BY_ONE);
  const settled = await Promise.allSettled(
    databases.map(async (db) => {
      const tde = await api.arm.get<{ properties?: { state?: string } }>(
        `${db.id}/transparentDataEncryption/current?api-version=2021-11-01`,
      );
      return { name: db.name, on: tde.properties?.state === 'Enabled' };
    }),
  );
  refusedAmong(settled);
  return fulfilled(settled);
}

/** A storage account encrypts blobs and files unless one of them says outright that it does not. */
const isEncrypted = ({ properties }: StorageAccount): boolean => {
  const services = properties?.encryption?.services;
  return services?.blob?.enabled !== false && services?.file?.enabled !== false;
};

/**
 * Storage accounts, managed disks and SQL databases encrypt what they hold when it is not in use. Azure switches this
 * on by default, so a result that is not a pass means something was turned off on purpose.
 */
export const encryptionAtRest: AzureCheck = {
  id: 'encryption_at_rest',
  run: async (api, subscriptionId) => {
    const [stored, volumes, servers] = await Promise.allSettled([
      storageAccounts(api, subscriptionId),
      disks(api, subscriptionId),
      sqlServers(api, subscriptionId),
    ]);
    const items: Encrypted[] = [
      ...readable([stored]).map((account) => ({ name: account.name, on: isEncrypted(account) })),
      ...readable([volumes]).map((disk) => ({
        name: disk.name,
        on: Boolean(disk.properties?.encryption?.type),
      })),
      ...(servers.status === 'fulfilled'
        ? await sqlEncryption(api, subscriptionId, servers.value)
        : []),
    ];
    return judge(
      items,
      ({ on }): Verdict => (on ? 'ok' : 'fail'),
      ({ name }) => name,
    );
  },
};
