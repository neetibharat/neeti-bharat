import type { AzureApi } from '../azure-api';
import type { RoleAssignment, RoleDefinition } from './azure-lists';
import { judge, nothingToCheck, type AzureCheck, type Verdict } from './outcome';

/** The most people who may hold Owner or User Access Administrator at the level of the whole subscription. */
const MOST_OWNERS = 5;

const OWNER_ROLES = new Set(['owner', 'user access administrator']);
const PRIVILEGED_ROLES = new Set([...OWNER_ROLES, 'contributor']);

interface Grant {
  role: string;
  principalType: string;
}

/** Who holds which role over the whole subscription, by the name of the role. Narrower grants are not counted. */
async function subscriptionGrants(api: AzureApi, subscriptionId: string): Promise<Grant[]> {
  const base = `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization`;
  const [assignments, definitions] = await Promise.all([
    api.arm.list<RoleAssignment>(`${base}/roleAssignments?api-version=2022-04-01`),
    api.arm.list<RoleDefinition>(`${base}/roleDefinitions?api-version=2022-04-01`),
  ]);
  const names = new Map(
    definitions.map((role) => [
      (role.id ?? '').toLowerCase(),
      (role.properties?.roleName ?? '').toLowerCase(),
    ]),
  );
  return assignments
    .filter(
      ({ properties }) =>
        (properties?.scope ?? '').toLowerCase() === `/subscriptions/${subscriptionId}`,
    )
    .map(({ properties }) => ({
      role: names.get((properties?.roleDefinitionId ?? '').toLowerCase()) ?? '',
      principalType: properties?.principalType ?? '',
    }));
}

/** Few people can do everything, or hand out the power to: an account that is broken into can do all that it can. */
export const rbacPrivileged: AzureCheck = {
  id: 'rbac_privileged',
  run: async (api, subscriptionId) => {
    const grants = await subscriptionGrants(api, subscriptionId);
    const count = grants.filter(({ role }) => OWNER_ROLES.has(role)).length;
    return { status: count > MOST_OWNERS ? 'warn' : 'pass', values: { count, limit: MOST_OWNERS } };
  },
};

/** An app that holds the power to change things can be made to, by whoever gets its secret. */
export const rbacServicePrincipals: AzureCheck = {
  id: 'rbac_service_principals',
  run: async (api, subscriptionId) => {
    const grants = await subscriptionGrants(api, subscriptionId);
    const count = grants.filter(
      ({ role, principalType }) =>
        principalType === 'ServicePrincipal' && PRIVILEGED_ROLES.has(role),
    ).length;
    return { status: count > 0 ? 'warn' : 'pass', values: { count } };
  },
};

/** A custom role that allows everything is Owner under another name. */
export const rbacWildcardRoles: AzureCheck = {
  id: 'rbac_wildcard_roles',
  run: async (api, subscriptionId) => {
    const roles = await api.arm.list<RoleDefinition>(
      `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions?api-version=2022-04-01&$filter=${encodeURIComponent("type eq 'CustomRole'")}`,
    );
    if (roles.length === 0) return nothingToCheck;
    return judge(
      roles,
      ({ properties }): Verdict =>
        (properties?.permissions ?? []).some((permission) => permission.actions?.includes('*'))
          ? 'fail'
          : 'ok',
      ({ properties }) => properties?.roleName ?? '?',
    );
  },
};
