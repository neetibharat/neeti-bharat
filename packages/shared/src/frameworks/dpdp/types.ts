import type { JobRole } from '../../people.js';

/** The answers about a company that switch a rule on. `always` rules apply to everyone. */
export const RULE_CONDITIONS = ['always', 'children', 'abroad', 'sdf'] as const;

export type RuleCondition = (typeof RULE_CONDITIONS)[number];

export interface DpdpRule {
  /** Short id, for example `R6`. */
  id: string;
  /** How the law names it, for example `Rule 6`. */
  reference: string;
  title: string;
  summary: string;
  appliesWhen: RuleCondition;
}

/** The id of the built-in DPDP framework. */
export const DPDP_FRAMEWORK_ID = 'dpdp';

/** The built-in DPDP framework as it is first stored. A company can rename its copy. */
export const DPDP_FRAMEWORK = {
  id: DPDP_FRAMEWORK_ID,
  name: 'DPDP Act 2023 and Rules 2025',
  about: 'India’s data protection law. Built in and checked rule by rule.',
  seal: 'DPDP',
} as const;

/** Controls that belong to no single rule but support all of them. */
export const ORGANISATION_RULE_ID = 'ORG';

export interface DpdpControl {
  /** For example `DPDP-R6-01`. */
  id: string;
  /** A rule id, or `ORG`. */
  ruleId: string;
  title: string;
  description: string;
  /** The policies that cover this control. The only place control and policy are linked. */
  policyIds: readonly string[];
}

export interface DpdpPolicy {
  /** For example `P08`. */
  id: string;
  slug: string;
  title: string;
  summary: string;
  ownerRole: JobRole;
  /** A plain title such as "General Counsel". Not an assignable role yet. */
  approver: string;
  reviewEvery: 'annual';
  /** The sections and rules of the law this policy answers to. */
  legalReferences: readonly string[];
}
