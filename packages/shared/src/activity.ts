/**
 * Things that get written to the activity log. The API sends these codes and the web app turns each
 * into a sentence through `activity.actions.<code>`. Add a code here when a module starts recording
 * a new kind of change.
 */
export const ACTIVITY_ACTIONS = [
  'USER_CREATED',
  'INVITATION_CREATED',
  'INVITATION_REVOKED',
  'PERSON_ADDED',
  'PERSON_UPDATED',
  'ACCESS_CHANGED',
  'PERSON_LEFT',
  'ROLE_ASSIGNED',
  'ROLE_UNASSIGNED',
  'PROFILE_UPDATED',
  'PROFILE_ENTRY_ADDED',
  'PROFILE_ENTRY_REMOVED',
  'CONTROL_STATUS_CHANGED',
  'CONTROL_OWNER_CHANGED',
  'CONTROL_CREATED',
  'CONTROL_EDITED',
  'CONTROL_ASSIGNED',
  'CONTROL_ARCHIVED',
  'CONTROL_RESTORED',
  'POLICY_REVIEW_REQUESTED',
  'POLICY_APPROVED',
  'POLICY_SENT_BACK',
  'POLICY_REOPENED',
  'POLICY_EDITED',
  'POLICY_APPROVER_CHANGED',
  'EVIDENCE_ADDED',
  'EVIDENCE_REMOVED',
  'PROOF_REQUIREMENT_ADDED',
  'PROOF_REQUIREMENT_EDITED',
  'PROOF_REQUIREMENT_ARCHIVED',
  'PROOF_REQUIREMENT_RESTORED',
  'FRAMEWORK_CREATED',
  'FRAMEWORK_EDITED',
  'FRAMEWORK_ARCHIVED',
  'REQUIREMENT_CREATED',
  'REQUIREMENT_EDITED',
  'REQUIREMENT_ARCHIVED',
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export type ActivityValue = string | number | boolean | null;

/** One row of the log, from `GET /v1/activity`. */
export interface ActivityEventResponse {
  id: string;
  occurredAt: string;
  actorLabel: string;
  action: ActivityAction;
  /** Values the sentence for this action fills in, for example the email invited. */
  details: Record<string, ActivityValue> | null;
  before: Record<string, ActivityValue> | null;
  after: Record<string, ActivityValue> | null;
}

export interface ActivityListResponse {
  items: ActivityEventResponse[];
  /** Pass it back as `cursor` for the next, older page. Null on the last page. */
  nextCursor: string | null;
}

/** The answer to "has anyone tampered with the log?", from `GET /v1/activity/verify`. */
export interface ActivityVerifyResponse {
  ok: boolean;
  checked: number;
  /** Set when `ok` is false: the first event whose fingerprint does not match. */
  brokenAt?: string;
  /** Set when `ok` is false and the chain itself holds together but does not end at the newest event ever written: events were removed from its end. */
  truncated?: boolean;
}
