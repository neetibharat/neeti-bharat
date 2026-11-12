import type { AppRole, MeResponse, OrganizationSummary } from '@dpdp-kit/shared';

/** The signed-in person as the app uses them: who they are, and the organisation they are working in with their role there. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  /** Their role in the organisation they are working in. */
  role: AppRole;
  organization: OrganizationSummary;
  /** Every organisation they can switch to. */
  organizations: OrganizationSummary[];
}

export function toSessionUser(me: MeResponse, organization: OrganizationSummary): SessionUser {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: organization.role,
    organization,
    organizations: me.organizations,
  };
}
