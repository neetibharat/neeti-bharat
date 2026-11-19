export const POLICY_ACCEPTANCE_PAGE_SIZE = 25;

/** To read and accept, accepted, or accepted before the policy was approved again. */
export const POLICY_ACCEPTANCE_STATUSES = ['todo', 'accepted', 'changed'] as const;
export type PolicyAcceptanceStatus = (typeof POLICY_ACCEPTANCE_STATUSES)[number];

/** One approved policy as one person sees it. */
export interface PolicyAcceptanceItem {
  policyId: string;
  title: string;
  summary: string;
  /** The day the policy was last approved. */
  approvedOn: string;
  /** The day the person accepted it, or null while they have not. */
  acceptedOn: string | null;
  status: PolicyAcceptanceStatus;
}

export interface MyPoliciesResponse {
  items: PolicyAcceptanceItem[];
  /** Whether every approved policy has been accepted in its current form. */
  acceptedAll: boolean;
}

/** One person's progress through the approved policies. */
export interface TeamPolicyRow {
  personId: string;
  accepted: number;
  total: number;
}

export interface TeamPoliciesResponse {
  people: TeamPolicyRow[];
  total: number;
  page: number;
  pageSize: number;
  /** How many policies are approved, and how many people have accepted all of them. */
  policies: number;
  accepted: number;
  everyone: number;
}
