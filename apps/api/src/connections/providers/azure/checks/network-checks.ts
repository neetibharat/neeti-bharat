import { described, type Named } from './azure-lists';
import { judge, resourcesPath, type AzureCheck, type Verdict } from './outcome';

interface Rule {
  name?: string;
  properties?: {
    direction?: string;
    access?: string;
    sourceAddressPrefix?: string;
    sourceAddressPrefixes?: string[];
    destinationPortRange?: string;
    destinationPortRanges?: string[];
  };
}

interface SecurityGroup extends Named {
  properties?: { securityRules?: Rule[] };
}

const EVERYWHERE = new Set(['*', 'internet', 'any', '0.0.0.0/0']);

/** Remote login and database ports, which should never face the internet. */
const SENSITIVE_PORTS = [22, 3389, 1433, 3306, 5432, 445, 5985, 5986, 6379, 27017];

const fromEverywhere = ({ properties }: Rule): boolean =>
  [properties?.sourceAddressPrefix, ...(properties?.sourceAddressPrefixes ?? [])].some((prefix) =>
    EVERYWHERE.has((prefix ?? '').toLowerCase()),
  );

/** Whether a port range such as `*`, `22` or `3000-4000` covers a port that should stay closed. */
function coversSensitivePort(range: string): boolean {
  if (range === '*') return true;
  const [from, to = from] = range.split('-').map(Number);
  if (from === undefined || Number.isNaN(from) || to === undefined || Number.isNaN(to))
    return false;
  return SENSITIVE_PORTS.some((port) => port >= from && port <= to);
}

const reachesSensitivePort = ({ properties }: Rule): boolean =>
  [properties?.destinationPortRange, ...(properties?.destinationPortRanges ?? [])].some(
    (range) => range !== undefined && coversSensitivePort(range),
  );

const opensToTheInternet = (rule: Rule): boolean =>
  rule.properties?.direction === 'Inbound' &&
  rule.properties?.access === 'Allow' &&
  fromEverywhere(rule) &&
  reachesSensitivePort(rule);

/** No rule lets anyone on the internet reach a remote login or database port. */
export const nsgOpenPorts: AzureCheck = {
  id: 'nsg_open_ports',
  run: async (api, subscriptionId) =>
    judge(
      await api.arm.list<SecurityGroup>(
        resourcesPath(subscriptionId, 'Microsoft.Network/networkSecurityGroups', '2023-09-01'),
      ),
      (group): Verdict =>
        (group.properties?.securityRules ?? []).some(opensToTheInternet) ? 'fail' : 'ok',
      (group) =>
        described(group, {
          securityRules: (group.properties?.securityRules ?? [])
            .filter(opensToTheInternet)
            .map((rule) => rule.name ?? '?')
            .join(', '),
        }),
    ),
};
