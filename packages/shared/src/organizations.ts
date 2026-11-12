import type { AppRole } from './roles.js';

/** The header that says which organisation a request is for. Set by the web app from the organisation being viewed. */
export const ORGANIZATION_HEADER = 'x-organization-id';

export const ORGANIZATION_NAME_MAX_LENGTH = 120;

/** An organisation the signed-in person belongs to, and the role they have in it. */
export interface OrganizationSummary {
  id: string;
  name: string;
  role: AppRole;
  /** False until an admin has finished (or skipped) the set-up that follows creating an organisation. */
  onboarded: boolean;
}

/** The organisations the signed-in person can open, from `GET /v1/organizations`. */
export interface OrganizationListResponse {
  organizations: OrganizationSummary[];
}

/** A new organisation. Whoever makes it is its first admin, and it starts with the DPDP checklist. */
export interface CreateOrganizationRequest {
  name: string;
}
