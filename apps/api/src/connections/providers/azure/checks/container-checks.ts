import { aksClusters, containerRegistries, type AksCluster } from './azure-lists';
import type { Found, Verdict } from './outcome';
import { rule } from './rules';

type Cluster = AksCluster['properties'];

const aks = (
  id: Parameters<typeof rule>[0],
  verdict: (properties: Cluster) => Verdict,
  found: (properties: Cluster) => Found,
) =>
  rule(
    id,
    aksClusters,
    ({ properties }) => verdict(properties),
    ({ properties }) => found(properties),
  );

/** Who may do what in the cluster is decided by roles, not by every credential being all-powerful. */
export const aksRbac = aks(
  'aks_rbac',
  (properties) => (properties?.enableRBAC === false ? 'fail' : 'ok'),
  (properties) => ({ enableRBAC: properties?.enableRBAC }),
);

/** People sign in to the cluster with their work account, which the organisation can switch off. */
export const aksAad = aks(
  'aks_aad',
  (properties) => (properties?.aadProfile ? 'ok' : 'warn'),
  (properties) => ({ aadProfile: properties?.aadProfile ? 'set' : undefined }),
);

/** Without a network policy, any workload can talk to any other. */
export const aksNetworkPolicy = aks(
  'aks_network_policy',
  (properties) => (properties?.networkProfile?.networkPolicy ? 'ok' : 'warn'),
  (properties) => ({ 'networkProfile.networkPolicy': properties?.networkProfile?.networkPolicy }),
);

/** The cluster's control point is private, or open only to listed addresses. */
export const aksPrivateApi = aks(
  'aks_private_api',
  (properties) => {
    const access = properties?.apiServerAccessProfile;
    return access?.enablePrivateCluster === true || (access?.authorizedIPRanges?.length ?? 0) > 0
      ? 'ok'
      : 'warn';
  },
  (properties) => ({
    enablePrivateCluster: properties?.apiServerAccessProfile?.enablePrivateCluster,
    authorizedIPRanges: properties?.apiServerAccessProfile?.authorizedIPRanges?.length ?? 0,
  }),
);

export const aksPolicyAddon = aks(
  'aks_policy_addon',
  (properties) => (properties?.addonProfiles?.azurepolicy?.enabled === true ? 'ok' : 'warn'),
  (properties) => ({
    'addonProfiles.azurepolicy.enabled': properties?.addonProfiles?.azurepolicy?.enabled,
  }),
);

export const aksAutoUpgrade = aks(
  'aks_auto_upgrade',
  (properties) => {
    const channel = properties?.autoUpgradeProfile?.upgradeChannel;
    return channel && channel !== 'none' ? 'ok' : 'warn';
  },
  (properties) => ({ upgradeChannel: properties?.autoUpgradeProfile?.upgradeChannel }),
);

/** Either of the two ways a cluster is monitored: the container insights add-on, or Azure Monitor metrics. */
const isMonitored = (properties: AksCluster['properties']): boolean =>
  properties?.addonProfiles?.omsagent?.enabled === true ||
  properties?.azureMonitorProfile?.metrics?.enabled === true;

export const aksMonitoring = aks(
  'aks_monitoring',
  (properties) => (isMonitored(properties) ? 'ok' : 'warn'),
  (properties) => ({
    'addonProfiles.omsagent.enabled': properties?.addonProfiles?.omsagent?.enabled,
    'azureMonitorProfile.metrics.enabled': properties?.azureMonitorProfile?.metrics?.enabled,
  }),
);

/** A shared admin login for the registry, which cannot be tied to a person. */
export const acrAdminUser = rule(
  'acr_admin_user',
  containerRegistries,
  ({ properties }): Verdict => (properties?.adminUserEnabled === true ? 'fail' : 'ok'),
  ({ properties }) => ({ adminUserEnabled: properties?.adminUserEnabled }),
);

export const acrPublicAccess = rule(
  'acr_public_access',
  containerRegistries,
  ({ properties }): Verdict => (properties?.publicNetworkAccess === 'Enabled' ? 'warn' : 'ok'),
  ({ properties }) => ({ publicNetworkAccess: properties?.publicNetworkAccess }),
);

/** Anyone can pull images without signing in. */
export const acrAnonymousPull = rule(
  'acr_anonymous_pull',
  containerRegistries,
  ({ properties }): Verdict => (properties?.anonymousPullEnabled === true ? 'fail' : 'ok'),
  ({ properties }) => ({ anonymousPullEnabled: properties?.anonymousPullEnabled }),
);

/** Signed images and clean-up of old ones are features of the Premium tier, so a smaller one is not marked down for them. */
const premium = ({ sku }: { sku?: { name?: string } }): boolean => sku?.name === 'Premium';

export const acrContentTrust = rule(
  'acr_content_trust',
  containerRegistries,
  (registry): Verdict =>
    premium(registry) && registry.properties?.policies?.trustPolicy?.status !== 'enabled'
      ? 'warn'
      : 'ok',
  ({ sku, properties }) => ({
    'sku.name': sku?.name,
    'policies.trustPolicy.status': properties?.policies?.trustPolicy?.status,
  }),
);

export const acrRetention = rule(
  'acr_retention',
  containerRegistries,
  (registry): Verdict =>
    premium(registry) && registry.properties?.policies?.retentionPolicy?.status !== 'enabled'
      ? 'warn'
      : 'ok',
  ({ sku, properties }) => ({
    'sku.name': sku?.name,
    'policies.retentionPolicy.status': properties?.policies?.retentionPolicy?.status,
  }),
);
