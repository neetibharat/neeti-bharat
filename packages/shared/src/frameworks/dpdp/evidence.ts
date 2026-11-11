import type { ControlPolicyResponse, ControlStatus } from './checklist.js';

/** What a piece of proof is. Files will be added once the app has somewhere to keep them. */
export const EVIDENCE_KINDS = ['link', 'note'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_TITLE_MAX_LENGTH = 120;
export const EVIDENCE_NOTE_MAX_LENGTH = 2000;
export const EVIDENCE_URL_MAX_LENGTH = 2000;

/** How often proof has to be provided again. `once` never goes out of date. */
export const PROOF_FREQUENCIES = ['once', 'monthly', 'quarterly', 'yearly'] as const;
export type ProofFrequency = (typeof PROOF_FREQUENCIES)[number];

export const PROOF_TITLE_MAX_LENGTH = 120;
export const PROOF_DESCRIPTION_MAX_LENGTH = 600;

/** How long proof stays good, in days. `null` means for ever. */
export const PROOF_FRESH_DAYS: Readonly<Record<ProofFrequency, number | null>> = {
  once: null,
  monthly: 31,
  quarterly: 92,
  yearly: 366,
};

/** Where a requirement stands: nothing provided yet, provided and still good, or provided but now out of date. */
export type ProofStatus = 'missing' | 'provided' | 'due';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Works out a requirement's status from when proof was last provided for it. */
export function proofStatus(
  lastProvidedAt: Date | null,
  frequency: ProofFrequency,
  now: Date,
): ProofStatus {
  if (!lastProvidedAt) return 'missing';
  const days = PROOF_FRESH_DAYS[frequency];
  if (days === null) return 'provided';
  return now.getTime() - lastProvidedAt.getTime() > days * DAY_MS ? 'due' : 'provided';
}

/**
 * When proof is next needed, and whether that date has passed. After proof is given the frequency sets the date;
 * before that it is the due date the company chose, if any. `once` proof, once given, is never needed again.
 */
export function proofDue(
  lastProvidedAt: Date | null,
  frequency: ProofFrequency,
  dueDate: Date | null,
  now: Date,
): { dueOn: Date | null; overdue: boolean } {
  const days = PROOF_FRESH_DAYS[frequency];
  const dueOn = !lastProvidedAt
    ? dueDate
    : days === null
      ? null
      : new Date(lastProvidedAt.getTime() + days * DAY_MS);
  return { dueOn, overdue: dueOn !== null && dueOn.getTime() < now.getTime() };
}

/** One piece of proof attached to a control. */
export interface EvidenceResponse {
  id: string;
  kind: EvidenceKind;
  title: string;
  /** For a link. */
  url: string | null;
  /** For a note. */
  note: string | null;
  addedByName: string;
  /** ISO date and time. */
  createdAt: string;
}

/** A thing the control needs proof of, with the proof given so far. */
export interface ProofRequirementResponse {
  id: string;
  title: string;
  /** What to collect, in a sentence or two. May be empty. */
  description: string;
  frequency: ProofFrequency;
  status: ProofStatus;
  /** The person who collects it, or null when the control's owner does. */
  assigneeId: string | null;
  /** YYYY-MM-DD the company set for the first proof, or null. */
  dueDate: string | null;
  /** ISO date and time proof is next needed, or null. */
  dueOn: string | null;
  /** True when that date has passed. */
  overdue: boolean;
  /** Newest first. */
  evidence: EvidenceResponse[];
}

/** The control a requirement is for, with only what its page shows. */
export interface RequirementControlResponse {
  id: string;
  title: string;
  description: string;
  status: ControlStatus;
  /** The framework and rule it sits under, to link back to them. */
  frameworkId: string;
  requirementId: string;
  policies: ControlPolicyResponse[];
}

/** One requirement on its own page, with the control it is for. */
export interface ProofRequirementDetailResponse {
  requirement: ProofRequirementResponse;
  control: RequirementControlResponse;
}

/** A requirement that was archived, kept so it can be brought back. */
export interface ArchivedRequirementResponse {
  id: string;
  title: string;
  frequency: ProofFrequency;
}

/** What a control's proof area shows besides its requirements: the archived ones and loose proof. */
export interface EvidenceListResponse {
  archived: ArchivedRequirementResponse[];
  /** Proof attached to the control that is not for any one requirement. */
  other: EvidenceResponse[];
}

/** Proof to attach. Give `proofRequirementId` to attach it to a requirement; leave it out for general proof. */
export type AddEvidenceRequest = (
  { kind: 'link'; title: string; url: string } | { kind: 'note'; title: string; note: string }
) & { proofRequirementId?: string };

/** What a company can change about a requirement. */
export interface SaveProofRequirementRequest {
  title: string;
  description: string;
  frequency: ProofFrequency;
  /** A person's id, or null for the control's owner. */
  assigneeId: string | null;
  /** YYYY-MM-DD, or null for no due date. */
  dueDate: string | null;
}

/** One requirement on the Evidence page, with the control it belongs to. */
export interface ProofItemResponse {
  id: string;
  title: string;
  frequency: ProofFrequency;
  status: ProofStatus;
  controlId: string;
  controlTitle: string;
  /** The rule or group the control sits under, such as R6 or ORG. */
  ruleId: string;
  /** The job that owns the control. */
  ownerRole: string;
  /** Whoever holds that job, or null while it is vacant. */
  ownerName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  /** ISO date and time proof is next needed, or null. */
  dueOn: string | null;
  overdue: boolean;
}

/** How many proof items the list shows on a page. */
export const PROOF_PAGE_SIZE = 25;

/** The tabs of the proof list. Overdue is not a status: it cuts across missing and due again. */
export const PROOF_TABS = ['all', 'overdue', 'missing', 'due', 'provided'] as const;
export type ProofTab = (typeof PROOF_TABS)[number];

/** How many items each tab would show for the current search and filters, so tabs and totals stay honest. */
export type ProofCounts = Record<ProofTab, number>;

/** One page of what needs proof, from `GET /v1/proof`. */
export interface ProofOverviewResponse {
  items: ProofItemResponse[];
  /** How many items the chosen tab shows across all pages. */
  total: number;
  page: number;
  pageSize: number;
  counts: ProofCounts;
  /** The rules that have something to prove, for the rule filter. */
  rules: string[];
  /** The control the list is narrowed to, when one was asked for. */
  control: { id: string; title: string; ruleId: string } | null;
}
