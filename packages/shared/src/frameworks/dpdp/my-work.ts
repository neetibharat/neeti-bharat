/**
 * What kind of work it is. `proof` is evidence to collect, `approve` is a policy waiting for this person's decision,
 * `review` is an approved policy due to be looked at again, and `draft` is a policy still to be written,
 * `breach` is a personal data breach that is not closed yet,
 * and `request` is a request from a person that is not done yet.
 */
export const MY_WORK_KINDS = ['breach', 'request', 'proof', 'approve', 'review', 'draft'] as const;
export type MyWorkKind = (typeof MY_WORK_KINDS)[number];

/** One thing for the signed-in person to do. */
export interface MyWorkItem {
  kind: MyWorkKind;
  /** The proof requirement or the policy, for building a link. */
  id: string;
  title: string;
  /** What it belongs to: the control for proof, the policy code for a policy, the step to do next for a breach, the request type for a request. */
  context: string;
  /** ISO date and time it is due, or null when no date applies. */
  dueOn: string | null;
  overdue: boolean;
}

/** Everything assigned to the signed-in person, most urgent first, from `GET /v1/my-work`. */
export interface MyWorkResponse {
  items: MyWorkItem[];
}

/** How much is waiting on one person, from `GET /v1/my-work/team`. */
export interface MyWorkload {
  personId: string;
  open: number;
  overdue: number;
}

export interface MyWorkTeamResponse {
  members: MyWorkload[];
}
