import { environmentOf } from './environment';
import { groupOf, type ResourceGroup } from './azure-lists';
import { judge, type AzureCheck, type Described, type Verdict } from './outcome';

const under = (subscriptionId: string) => `/subscriptions/${subscriptionId}`;

interface Alert {
  properties?: {
    enabled?: boolean;
    condition?: { allOf?: { field?: string; equals?: string }[] };
  };
}

/** The changes that open a way in, or hide one: each should raise an alert so that someone is told. */
const WATCHED_OPERATIONS = [
  'Microsoft.Authorization/policyAssignments/write',
  'Microsoft.Security/securitySolutions/write',
  'Microsoft.Network/networkSecurityGroups/write',
  'Microsoft.Sql/servers/firewallRules/write',
];

const watches = (alert: Alert, operation: string): boolean =>
  alert.properties?.enabled !== false &&
  (alert.properties?.condition?.allOf ?? []).some(
    (condition) =>
      condition.field === 'operationName' &&
      condition.equals?.toLowerCase() === operation.toLowerCase(),
  );

export const monitorAlerts: AzureCheck = {
  id: 'monitor_alerts',
  run: async (api, subscriptionId) => {
    const alerts = await api.arm.list<Alert>(
      `${under(subscriptionId)}/providers/Microsoft.Insights/activityLogAlerts?api-version=2020-10-01`,
    );
    const missing = WATCHED_OPERATIONS.filter(
      (operation) => !alerts.some((alert) => watches(alert, operation)),
    );
    return {
      status: missing.length === 0 ? 'pass' : 'warn',
      values: {
        count: missing.length,
        total: WATCHED_OPERATIONS.length,
        names: missing.join(', '),
      },
    };
  },
};

interface DiagnosticSetting {
  properties?: {
    workspaceId?: string;
    storageAccountId?: string;
    eventHubAuthorizationRuleId?: string;
    marketplacePartnerId?: string;
  };
}

/** The subscription's activity log goes somewhere it is kept, such as a Log Analytics workspace or a storage account. */
export const monitorLogExport: AzureCheck = {
  id: 'monitor_log_export',
  run: async (api, subscriptionId) => {
    const settings = await api.arm.list<DiagnosticSetting>(
      `${under(subscriptionId)}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview`,
    );
    const exporting = settings.filter(({ properties }) =>
      Boolean(
        properties?.workspaceId ??
        properties?.storageAccountId ??
        properties?.eventHubAuthorizationRuleId ??
        properties?.marketplacePartnerId,
      ),
    ).length;
    return { status: exporting > 0 ? 'pass' : 'warn', values: { count: exporting } };
  },
};

/** At least one Azure Policy is assigned, so something is checking the resources against rules. */
export const policyAssignments: AzureCheck = {
  id: 'policy_assignments',
  run: async (api, subscriptionId) => {
    const assignments = await api.arm.list<object>(
      `${under(subscriptionId)}/providers/Microsoft.Authorization/policyAssignments?api-version=2022-06-01`,
    );
    return {
      status: assignments.length > 0 ? 'pass' : 'warn',
      values: { count: assignments.length },
    };
  },
};

/** Defender for Cloud plans that are off watch nothing: each is a paid plan, so this is a warning to decide, not a failure. */
export const defenderPlans: AzureCheck = {
  id: 'defender_plans',
  run: async (api, subscriptionId) => {
    const plans = await api.arm.list<{ name: string; properties?: { pricingTier?: string } }>(
      `${under(subscriptionId)}/providers/Microsoft.Security/pricings?api-version=2024-01-01`,
    );
    return judge(
      plans,
      ({ properties }): Verdict => (properties?.pricingTier === 'Standard' ? 'ok' : 'warn'),
      ({ name, properties }) => ({ name, found: { pricingTier: properties?.pricingTier } }),
    );
  },
};

interface Assessment {
  properties?: {
    displayName?: string;
    status?: { code?: string };
    metadata?: { severity?: string };
    resourceDetails?: { Id?: string; ResourceId?: string };
    links?: { azurePortal?: string };
  };
}

type AssessmentProperties = NonNullable<Assessment['properties']>;

// Older and newer versions of the API name the resource's address differently.
const assessedId = (details: AssessmentProperties['resourceDetails']): string | undefined =>
  details?.Id ?? details?.ResourceId;

/** Defender gives the portal page without the scheme. */
const portalUrl = (portal?: string): string | undefined =>
  portal ? `https://${portal.replace(/^https:\/\//, '')}` : undefined;

/** The recommendation, the resource it is about, and its page in the portal. */
function recommendation({ properties = {} }: Assessment): Described {
  const resourceId = assessedId(properties.resourceDetails);
  return {
    name: properties.displayName ?? '?',
    group: groupOf(resourceId),
    url: portalUrl(properties.links?.azurePortal),
    found: { severity: properties.metadata?.severity, resource: resourceId?.split('/').pop() },
  };
}

/** What Defender for Cloud itself recommends fixing: high severity is a failure, the rest a warning. */
export const defenderRecommendations: AzureCheck = {
  id: 'defender_recommendations',
  run: async (api, subscriptionId) => {
    const assessments = await api.arm.list<Assessment>(
      `${under(subscriptionId)}/providers/Microsoft.Security/assessments?api-version=2021-06-01`,
    );
    return judge(
      assessments,
      ({ properties }): Verdict => {
        if (properties?.status?.code !== 'Unhealthy') return 'ok';
        return properties.metadata?.severity === 'High' ? 'fail' : 'warn';
      },
      recommendation,
    );
  },
};

/**
 * Production and non-production are kept in separate resource groups, told apart by an `environment` tag or by the
 * name. A resource group only divides what is inside a subscription, so this is the lightest separation there is;
 * separate subscriptions are stronger.
 */
export const environmentSeparation: AzureCheck = {
  id: 'environment_separation',
  run: async (api, subscriptionId) => {
    const groups = await api.arm.list<ResourceGroup>(
      `${under(subscriptionId)}/resourcegroups?api-version=2021-04-01`,
    );
    const kinds = groups.map(environmentOf);
    const production = kinds.filter((kind) => kind === 'production').length;
    const nonProduction = kinds.filter((kind) => kind === 'non-production').length;
    const separated = production > 0 && nonProduction > 0;
    return {
      status: separated ? 'pass' : 'warn',
      values: { production, nonProduction, total: groups.length },
    };
  },
};
