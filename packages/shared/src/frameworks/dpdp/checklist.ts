import type { JobRole } from '../../people.js';
import type { PolicyResponse, PolicyStatus } from './policy-status.js';
import type { DpdpRule, RuleCondition } from './types.js';
import { ORGANISATION_RULE_ID } from './types.js';

/** How far along a control is. It is worked out from its policies and its proof, never picked by hand. */
export const CONTROL_STATUSES = ['not_started', 'in_progress', 'done'] as const;
export type ControlStatus = (typeof CONTROL_STATUSES)[number];

/** The proof a control has: how much it needs, how much of that is provided and still good, and all proof attached. */
export interface ProofTally {
  required: number;
  provided: number;
  attached: number;
}

/**
 * A control is done when every policy that covers it is approved and its proof is in. Its proof is in when
 * every requirement it has is provided and still good, or, for a control with none, when it has any proof.
 * It has not started while no policy has moved past draft and nothing is attached. Anything else is in progress.
 */
export function computeControlStatus(
  policyStatuses: readonly PolicyStatus[],
  proof: ProofTally,
): ControlStatus {
  const policiesDone = policyStatuses.every((status) => status === 'approved');
  const proofDone = proof.required > 0 ? proof.provided === proof.required : proof.attached > 0;
  if (policiesDone && proofDone) return 'done';
  const started = policyStatuses.some((status) => status !== 'draft') || proof.attached > 0;
  return started ? 'in_progress' : 'not_started';
}

/** Shown after the 13 rules, for the controls that support all of them. */
export const ORGANISATION_GROUP: DpdpRule = {
  id: ORGANISATION_RULE_ID,
  reference: 'Organisation',
  title: 'Organisation-wide controls',
  summary: 'Governance, training, risk and records that support every rule.',
  appliesWhen: 'always',
};

/** The company's set-up answers, as yes or no. */
export interface SetupAnswers {
  children: boolean;
  abroad: boolean;
  sdf: boolean;
}

/** Whether a rule applies to a company, given its set-up answers. */
export function ruleApplies(condition: RuleCondition, answers: SetupAnswers): boolean {
  return condition === 'always' || answers[condition];
}

export interface ControlPolicyResponse {
  id: string;
  title: string;
}

export interface ControlResponse {
  id: string;
  title: string;
  description: string;
  policies: ControlPolicyResponse[];
  /** Worked out from the policies and the proof. See `computeControlStatus`. */
  status: ControlStatus;
  /** How many of the policies covering it are approved, out of how many cover it. */
  policiesApproved: number;
  policiesTotal: number;
  /** The job that owns it: the default unless `ownerIsDefault` is false. */
  ownerRole: JobRole;
  ownerIsDefault: boolean;
  /** Whoever holds that job now, or null while it is vacant. */
  ownerName: string | null;
  /** The framework it belongs to, such as dpdp. */
  frameworkId: string;
  /** The rule or group it sits under, such as R6 or ORG. */
  requirementId: string;
  /** True for a control the company added, false for one copied from the catalogue. */
  isCustom: boolean;
  /** A named person on the control, besides the job's owner. */
  assignee: { id: string; name: string } | null;
  /** YYYY-MM-DD, or null when no review date is set. */
  reviewDate: string | null;
  /** How many pieces of proof are attached in all. */
  evidenceCount: number;
  /** How many things it needs proof of, and how many of those are provided and still good. */
  proofRequired: number;
  proofProvided: number;
}

/** A control that has been archived, shown so it can be restored. */
export interface ArchivedControlResponse {
  id: string;
  title: string;
}

export interface RuleResponse {
  id: string;
  /** The framework it belongs to, such as dpdp. */
  frameworkId: string;
  reference: string;
  title: string;
  summary: string;
  appliesWhen: RuleCondition;
  /** True for a rule the company added to a framework of its own. Built-in rules cannot be changed. */
  isCustom: boolean;
  /** False when the company's set-up answers switch this rule off. It does not count towards progress. */
  applies: boolean;
  controls: ControlResponse[];
}

/** A framework: a set of rules a company follows. */
export interface FrameworkResponse {
  id: string;
  name: string;
  /** One sentence on what it is. */
  about: string;
  /** The short mark on its badge, such as DPDP. */
  seal: string;
  /** True for one that ships with Neeti Bharat, false for one the company made. */
  isBuiltIn: boolean;
}

/** A framework with how far along it is, for the list of frameworks. Only rules that apply are counted. */
export interface FrameworkSummaryResponse extends FrameworkResponse {
  controlsDone: number;
  controlsTotal: number;
}

/** The frameworks, from `GET /v1/frameworks`. */
export interface FrameworkListResponse {
  frameworks: FrameworkSummaryResponse[];
}

/** One rule on its own page, from `GET /v1/frameworks/:frameworkId/rules/:ruleId`. */
export interface RulePageResponse {
  rule: RuleResponse;
  /** Only the policies that cover this rule's controls, each once. */
  policies: PolicyResponse[];
}

/** One framework's checklist, from `GET /v1/frameworks/:id`. */
export interface ChecklistResponse {
  framework: FrameworkResponse;
  rules: RuleResponse[];
  archived: ArchivedControlResponse[];
}
