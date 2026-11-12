import { aksClusters, containerRegistries, type AksCluster } from './azure-lists';
import type { Verdict } from './outcome';
import { rule } from './rules';

const aks = (id: Parameters<typeof rule>[0], verdict: (cluster: AksCluster) => Verdict) =>
  rule(id, aksClusters, verdict);

/** Who may do what in the cluster is decided by roles, not by every credential being all-powerful. */
export const aksRbac = aks('aks_rbac', ({ properties }) =>
  properties?.enableRBAC === false ? 'fail' : 'ok',
);

/** People sign in to the cluster with their work account, which the organisation can switch off. */
export const aksAad = aks('aks_aad', ({ properties }) => (properties?.aadProfile ? 'ok' : 'warn'));

/** Without a network policy, any workload can talk to any other. */
export const aksNetworkPolicy = aks('aks_network_policy', ({ properties }) =>
  properties?.networkProfile?.networkPolicy ? 'ok' : 'warn',
);

/** The cluster's control point is private, or open only to listed addresses. */
export const aksPrivateApi = aks('aks_private_api', ({ properties }) => {
  const access = properties?.apiServerAccessProfile;
  return access?.enablePrivateCluster === true || (access?.authorizedIPRanges?.length ?? 0) > 0
    ? 'ok'
    : 'warn';
});

export const aksPolicyAddon = aks('aks_policy_addon', ({ properties }) =>
  properties?.addonProfiles?.azurepolicy?.enabled === true ? 'ok' : 'warn',
);

export const aksAutoUpgrade = aks('aks_auto_upgrade', ({ properties }) => {
  const channel = properties?.autoUpgradeProfile?.upgradeChannel;
  return channel && channel !== 'none' ? 'ok' : 'warn';
});

/** Either of the two ways a cluster is monitored: the container insights add-on, or Azure Monitor metrics. */
const isMonitored = (properties: AksCluster['properties']): boolean =>
  properties?.addonProfiles?.omsagent?.enabled === true ||
  properties?.azureMonitorProfile?.metrics?.enabled === true;

export const aksMonitoring = aks('aks_monitoring', ({ properties }) =>
  isMonitored(properties) ? 'ok' : 'warn',
);

/** A shared admin login for the registry, which cannot be tied to a person. */
export const acrAdminUser = rule(
  'acr_admin_user',
  containerRegistries,
  ({ properties }): Verdict => (properties?.adminUserEnabled === true ? 'fail' : 'ok'),
);

export const acrPublicAccess = rule(
  'acr_public_access',
  containerRegistries,
  ({ properties }): Verdict => (properties?.publicNetworkAccess === 'Enabled' ? 'warn' : 'ok'),
);

/** Anyone can pull images without signing in. */
export const acrAnonymousPull = rule(
  'acr_anonymous_pull',
  containerRegistries,
  ({ properties }): Verdict => (properties?.anonymousPullEnabled === true ? 'fail' : 'ok'),
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
);

export const acrRetention = rule('acr_retention', containerRegistries, (registry): Verdict =>
  premium(registry) && registry.properties?.policies?.retentionPolicy?.status !== 'enabled'
    ? 'warn'
    : 'ok',
);
