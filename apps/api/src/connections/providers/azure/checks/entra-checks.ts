import { judge, nothingToCheck, type AzureCheck } from './outcome';

interface Registration {
  userType?: string;
  isMfaRegistered?: boolean;
}

/** Guests belong to another organisation and answer for their own sign-in, so only the organisation's own members are counted. */
export const mfaRegistered: AzureCheck = {
  id: 'entra_mfa_registered',
  run: async (api) => {
    const users = await api.graph.list<Registration>(
      '/v1.0/reports/authenticationMethods/userRegistrationDetails?$select=userType,isMfaRegistered&$top=999',
    );
    const members = users.filter((user) => user.userType !== 'guest');
    // People are counted, not named: the list of who has no second step is in Entra, for whoever needs it.
    return judge(members, (user) => (user.isMfaRegistered ? 'ok' : 'fail'));
  },
};

interface AccessPolicy {
  state?: string;
  grantControls?: { builtInControls?: string[] };
  conditions?: { users?: { includeUsers?: string[] } };
}

const requiresMfaForEveryone = (policy: AccessPolicy): boolean =>
  policy.state === 'enabled' &&
  Boolean(policy.grantControls?.builtInControls?.includes('mfa')) &&
  Boolean(policy.conditions?.users?.includeUsers?.includes('All'));

/** A second step is required for everyone, either by Microsoft's security defaults or by a conditional access policy. */
export const mfaEnforced: AzureCheck = {
  id: 'entra_mfa_enforced',
  run: async (api) => {
    const defaults = await api.graph.get<{ isEnabled?: boolean }>(
      '/v1.0/policies/identitySecurityDefaultsEnforcementPolicy',
    );
    if (defaults.isEnabled) return { status: 'pass', values: { count: 0 } };
    const policies = await api.graph.list<AccessPolicy>(
      '/v1.0/identity/conditionalAccess/policies',
    );
    const enforcing = policies.filter(requiresMfaForEveryone).length;
    return enforcing > 0
      ? { status: 'pass', values: { count: enforcing } }
      : { status: 'fail', values: { count: 0 } };
  },
};

const GLOBAL_ADMINISTRATOR = '62e90394-69f5-4237-9190-012177145e10';
const FEWEST_ADMINS = 2;
const MOST_ADMINS = 5;

/** One global administrator is a single point of failure, and many is a lot of power: two to five is a sound range. */
export const adminCount: AzureCheck = {
  id: 'entra_admin_count',
  run: async (api) => {
    const roles = await api.graph.list<{ id: string; roleTemplateId: string }>(
      '/v1.0/directoryRoles?$select=id,roleTemplateId',
    );
    const role = roles.find((candidate) => candidate.roleTemplateId === GLOBAL_ADMINISTRATOR);
    if (!role) return nothingToCheck;
    const members = await api.graph.list<{ id: string }>(
      `/v1.0/directoryRoles/${encodeURIComponent(role.id)}/members?$select=id`,
    );
    const count = members.length;
    const sound = count >= FEWEST_ADMINS && count <= MOST_ADMINS;
    return { status: sound ? 'pass' : 'warn', values: { count } };
  },
};
