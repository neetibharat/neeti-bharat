import type { JobRole } from '../../people.js';

export const CONTROL_TITLE_MAX_LENGTH = 120;
export const CONTROL_DESCRIPTION_MAX_LENGTH = 600;

/** What a company picks when adding a control. `policyIds` are the policies that cover it. */
export interface ControlDetailsRequest {
  title: string;
  description: string;
  /** A person's id, or null for nobody. */
  assigneeId: string | null;
  /** YYYY-MM-DD, or null for no review date. */
  reviewDate: string | null;
  policyIds: string[];
}

/** What a company can change about a control. `policyIds` replaces the policies that cover it. */
export interface SaveControlRequest extends ControlDetailsRequest {
  /** The job accountable for it when no one person is named. */
  ownerRole: JobRole;
}

/** A control the company adds, under one of the rules or the organisation group. It starts with its main policy's owner. */
export interface CreateControlRequest extends ControlDetailsRequest {
  requirementId: string;
}

/** The people work can be given to, from `GET /v1/assignees`. */
export interface AssigneesResponse {
  people: { id: string; name: string }[];
}
