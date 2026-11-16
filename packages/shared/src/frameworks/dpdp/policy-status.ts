import type { JobRole } from '../../people.js';
import type { PolicyDocument } from './policy-document.js';

/** Where a policy stands: being drafted, waiting for its approver, or approved. */
export const POLICY_STATUSES = ['draft', 'in_review', 'approved'] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

/** The moves a policy can make. Anything else is refused. */
export const POLICY_TRANSITIONS: Readonly<Record<PolicyStatus, readonly PolicyStatus[]>> = {
  draft: ['in_review'],
  in_review: ['approved', 'draft'],
  approved: ['draft'],
};

/** Anyone who can edit may ask for approval. Approving, sending back and reopening are for an admin. */
export function transitionNeedsAdmin(from: PolicyStatus, to: PolicyStatus): boolean {
  return !(from === 'draft' && to === 'in_review');
}

/** When an approved policy is due to be looked at again. Policies are reviewed every year. */
export function reviewDueAt(approvedAt: Date): Date {
  const due = new Date(approvedAt);
  due.setUTCFullYear(due.getUTCFullYear() + 1);
  return due;
}

export const CHANGELOG_MAX_LENGTH = 300;

/** One policy in the list, from `GET /v1/policies`. Dates are ISO strings. */
export interface PolicyResponse {
  id: string;
  title: string;
  summary: string;
  ownerRole: JobRole;
  /** A plain title such as "General Counsel". Used until a person is named. */
  approver: string;
  /** The person who must approve it, when one is named. */
  approverPerson: { id: string; name: string } | null;
  reviewEvery: string;
  status: PolicyStatus;
  /** Set while the policy is approved. */
  reviewDueAt: string | null;
  controlCount: number;
  /** True for a policy the company added, which is not one of the built-in ones. */
  isCustom: boolean;
}

export interface PolicyListResponse {
  policies: PolicyResponse[];
}

/** One approved version of a policy. */
export interface PolicyApprovalResponse {
  version: number;
  approvedAt: string;
  approvedByName: string;
  changelog: string | null;
}

/** A policy with its text and approval history, from `GET /v1/policies/:id`. */
export interface PolicyDetailResponse extends PolicyResponse {
  legalReferences: string[];
  /** What the company keeps to show the policy is followed. */
  evidence: string[];
  approvedAt: string | null;
  approvedByName: string | null;
  /** The number of the latest approved version, or 0 while it has never been approved. */
  version: number;
  /** Newest first. */
  approvals: PolicyApprovalResponse[];
  /** The working text. Until someone edits it, this is the starting text built from the controls. */
  content: PolicyDocument;
  /** When the text was last saved, as an ISO date and time. Null while it is the starting text. */
  editedAt: string | null;
  /** Who saved it. Null for edits made before this was recorded. */
  editedByName: string | null;
  /** What changed, written when approval was asked for. Shown to the approver. */
  changelog: string | null;
  /** Whether the person asking may approve, send back or reopen it: the named approver, or an admin when none is named. */
  canDecide: boolean;
  /** The company answers the text quotes, by key. Empty when not yet answered. */
  values: Record<string, string>;
}

/** One approved version's text, from `GET /v1/policies/:id/versions/:version`. */
export interface PolicyVersionResponse {
  content: PolicyDocument;
  values: Record<string, string>;
}

export interface ChangePolicyStatusRequest {
  status: PolicyStatus;
  /** What changed. Only used when asking for approval. */
  changelog?: string;
}

export interface SetPolicyApproverRequest {
  /** A person's id, or null to go back to the plain title. */
  approverId: string | null;
}
