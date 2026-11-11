import type { AccessLevel, PersonResponse, RoleHolderResponse } from '@dpdp-kit/shared';
import { JOB_ROLES } from '@dpdp-kit/shared';
import type { Account } from '../../users/repositories/user.repository';
import type { Invitation, RoleAssignment } from '../../generated/prisma/client';
import type { PersonWithRoles } from '../repositories/people.repository';

export interface Access {
  access: AccessLevel;
  /** True when the access is an invitation that has not been accepted yet. */
  invited: boolean;
}

/**
 * Someone's access, read from where it really lives: their account, or failing that their open
 * invitation. A disabled account, or neither, means no login: staff.
 */
export function accessOf(account?: Account | null, invitation?: Invitation | null): Access {
  if (account && !account.disabledAt) return { access: account.role, invited: false };
  if (!account && invitation) return { access: invitation.role, invited: true };
  return { access: 'staff', invited: false };
}

export function toPersonResponse(
  person: PersonWithRoles,
  account?: Account | null,
  invitation?: Invitation | null,
): PersonResponse {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    department: person.department,
    jobTitle: person.jobTitle,
    status: person.status,
    leftAt: person.leftAt?.toISOString() ?? null,
    ...accessOf(account, invitation),
    roles: person.roles.map((assignment) => assignment.role),
  };
}

/** Every job role, with its holder or null if it is vacant. */
export function toRoleHolders(assignments: RoleAssignment[]): RoleHolderResponse[] {
  return JOB_ROLES.map((role) => {
    const held = assignments.find((assignment) => assignment.role === role);
    return { role, personId: held?.personId ?? null, since: held?.since.toISOString() ?? null };
  });
}

/** The people on a page, each with the access found on their account or open invitation. */
export function toPersonResponses(
  persons: PersonWithRoles[],
  accounts: Account[],
  invitations: Invitation[],
): PersonResponse[] {
  const accountOf = new Map(accounts.map((account) => [account.email, account]));
  // Newest first, so the first one seen for an email is the one that counts.
  const invitationOf = new Map<string, Invitation>();
  for (const invitation of invitations) {
    if (!invitationOf.has(invitation.email)) invitationOf.set(invitation.email, invitation);
  }
  return persons.map((person) =>
    toPersonResponse(person, accountOf.get(person.email), invitationOf.get(person.email)),
  );
}
