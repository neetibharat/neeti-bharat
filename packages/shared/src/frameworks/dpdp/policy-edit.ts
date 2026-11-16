import type { JobRole } from '../../people.js';

/** What the id of anything a company adds starts with, which keeps it apart from catalogue codes such as P05. */
export const CUSTOM_ID_PREFIX = 'custom-';

/** How a policy is named on screen: a catalogue policy by code and title, the company's own by title. */
export const policyLabel = (policy: { id: string; title: string }): string =>
  policy.id.startsWith(CUSTOM_ID_PREFIX) ? policy.title : `${policy.id} · ${policy.title}`;

export const POLICY_TITLE_MAX_LENGTH = 120;
export const POLICY_SUMMARY_MAX_LENGTH = 600;
export const POLICY_APPROVER_TITLE_MAX_LENGTH = 80;

/** What a company can change about a policy's details. The text, the named approver and the status have their own routes. */
export interface SavePolicyRequest {
  title: string;
  /** What the policy is for, in a sentence or two. */
  summary: string;
  ownerRole: JobRole;
  /** A plain title such as "General Counsel". Used until a person is named. */
  approverTitle: string;
}

/** A policy the company adds. It sits under one of its frameworks and starts as a draft. */
export interface CreatePolicyRequest extends SavePolicyRequest {
  frameworkId: string;
}
