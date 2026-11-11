import type { AccessLevel, AppRole } from './roles.js';

/**
 * The named jobs that policies and controls refer to, such as the DPO. Each can be held by one person.
 * Not to be confused with `AppRole`, which is what someone may do inside the product.
 */
export const JOB_ROLES = [
  'DPO',
  'PRIVACY_LEAD',
  'SECURITY_LEAD',
  'ENGINEERING_LEAD',
  'PROCUREMENT_LEAD',
  'HR_LEAD',
  'AI_OWNER',
  'LEGAL_COUNSEL',
  'INTERNAL_AUDIT',
] as const;

export type JobRole = (typeof JOB_ROLES)[number];

export const PERSON_STATUSES = ['active', 'left'] as const;

export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const INVITATION_STATUSES = ['pending', 'accepted', 'revoked'] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** One person, from `GET /v1/people`. Dates are ISO strings. */
export interface PersonResponse {
  id: string;
  name: string;
  email: string;
  department: string | null;
  jobTitle: string | null;
  status: PersonStatus;
  leftAt: string | null;
  /** A login role, or `staff` while they have no login (no invitation yet, or it ran out). */
  access: AccessLevel;
  /** True while `access` is an invitation that has not been accepted yet. */
  invited: boolean;
  /** True when an invitation was sent, was never accepted, and has run out. It can be sent again. */
  inviteExpired: boolean;
  roles: JobRole[];
}

export interface RoleHolderResponse {
  role: JobRole;
  /** Null while the role is vacant. */
  personId: string | null;
}

/** What `GET /v1/people` can be asked. */
export const PEOPLE_PAGE_SIZE = 25;

/** Head counts that do not depend on the page or the search. */
export interface PeopleCounts {
  active: number;
  left: number;
  /** Active accounts plus open invitations: the people who can sign in, or soon will. */
  withLogin: number;
}

/** One page of people, from `GET /v1/people?status=&q=&page=&limit=`. */
export interface PeopleListResponse {
  people: PersonResponse[];
  /** How many people match the status and the search, across every page. */
  total: number;
  page: number;
  pageSize: number;
  counts: PeopleCounts;
}

/** Just enough to pick someone in a list, from `GET /v1/people/options`. Active people only. */
export interface PersonOptionResponse {
  id: string;
  name: string;
}

export interface PersonOptionsResponse {
  people: PersonOptionResponse[];
}

/** Who holds each job, from `GET /v1/roles`. */
export interface RoleHoldersResponse {
  roleHolders: RoleHolderResponse[];
}

export interface AddPersonRequest {
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  /** Every person is invited to sign in with this role. */
  access: AppRole;
}

export interface UpdatePersonRequest {
  name?: string;
  department?: string | null;
  jobTitle?: string | null;
}

export interface SetAccessRequest {
  access: AppRole;
}

export interface AssignRoleRequest {
  /** The person to hold the role, or null to leave it vacant. */
  personId: string | null;
}

/** What marking someone as left did, so the screen can tell the admin what is left for them to do. */
export interface LeaveResponse {
  releasedRoles: JobRole[];
  /** Controls, proof requirements and policy approvals that were named on them and went back to their role. */
  releasedAssignments: number;
}
