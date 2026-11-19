import {
  isBoardPending,
  proofDue,
  proofStatus,
  reviewDueAt,
  type BreachStep,
  type JobRole,
  type RequestType,
  type MyWorkItem,
  type MyWorkKind,
  type MyWorkload,
  type PolicyStatus,
} from '@dpdp-kit/shared';
import { iso, lastProvided } from './dates';
import { defaultOwnerFor, type ControlRow, type PolicyBriefs } from './checklist-view';

/** The little of a policy that decides whether it is work for someone. */
export interface WorkPolicy {
  id: string;
  title: string;
  status: PolicyStatus;
  ownerRole: JobRole;
  approverId: string | null;
  approvedAt: Date | null;
}

/** The little of an open breach that makes it work for someone. */
export interface WorkBreach {
  id: string;
  title: string;
  currentStep: BreachStep;
  reportDueAt: Date;
  overdue: boolean;
  assigneeId: string | null;
}

/** The little of an open request that makes it work for someone. */
export interface WorkRequest {
  id: string;
  type: RequestType;
  personName: string;
  dueAt: Date;
  overdue: boolean;
  assigneeId: string | null;
}

/** The little of a vendor in use that makes it work for someone. */
export interface WorkVendor {
  id: string;
  name: string;
  ownerId: string | null;
  reviewDueOn: Date | null;
}

/** One training waiting on one person: to take, or to take again. */
export interface WorkTraining {
  personId: string;
  id: string;
  name: string;
  dueOn: Date;
}

export interface MyWorkInput {
  personId: string;
  /** The jobs this person holds. */
  roles: ReadonlySet<string>;
  isAdmin: boolean;
  controls: ControlRow[];
  policies: WorkPolicy[];
  briefs: PolicyBriefs;
  breaches: WorkBreach[];
  requests: WorkRequest[];
  vendors: WorkVendor[];
  training: WorkTraining[];
  now: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** A policy review this close counts as work now. */
const REVIEW_WINDOW_DAYS = 30;
/** So does a vendor review. */
const VENDOR_WINDOW_DAYS = 30;

const RANK: Record<MyWorkKind, number> = {
  breach: 0,
  request: 1,
  approve: 2,
  review: 3,
  proof: 4,
  vendor: 5,
  training: 6,
  draft: 7,
};

/** Overdue first, then open breaches and requests, what is waiting on a decision, then reviews, proof, and drafts; the earliest date first within each. */
const byUrgency = (a: MyWorkItem, b: MyWorkItem): number =>
  (a.overdue ? 0 : RANK[a.kind]) - (b.overdue ? 0 : RANK[b.kind]) ||
  (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999');

/** A control is this person's when it names them, or names nobody and they hold the owner job. */
function controlIsMine(control: ControlRow, input: MyWorkInput): boolean {
  if (control.assignee) return control.assignee.id === input.personId;
  const role = control.ownerRole ?? defaultOwnerFor(control, input.briefs);
  return input.roles.has(role);
}

/** The proof this person has to collect: for requirements that name them, or name nobody on a control that is theirs. */
function proofWork(input: MyWorkInput): MyWorkItem[] {
  return input.controls.flatMap((control) => {
    const mine = controlIsMine(control, input);
    return control.proofRequirements.flatMap((requirement) => {
      const collector = requirement.assignee ? requirement.assignee.id === input.personId : mine;
      const last = lastProvided(requirement.evidence);
      if (!collector || proofStatus(last, requirement.frequency, input.now) === 'provided')
        return [];
      const due = proofDue(last, requirement.frequency, requirement.dueDate, input.now);
      return [
        {
          kind: 'proof' as const,
          id: requirement.id,
          title: requirement.title,
          context: control.title,
          dueOn: iso(due.dueOn),
          overdue: due.overdue,
        },
      ];
    });
  });
}

const canDecide = (policy: WorkPolicy, input: MyWorkInput): boolean =>
  policy.approverId ? policy.approverId === input.personId : input.isAdmin;

/** The work one policy gives this person, if any. */
function policyWork(policy: WorkPolicy, input: MyWorkInput): MyWorkItem | null {
  const base = { id: policy.id, title: policy.title, context: policy.id };
  if (policy.status === 'in_review') {
    return canDecide(policy, input)
      ? { ...base, kind: 'approve', dueOn: null, overdue: false }
      : null;
  }
  if (!input.roles.has(policy.ownerRole)) return null;
  if (policy.status === 'draft') return { ...base, kind: 'draft', dueOn: null, overdue: false };
  return reviewWork(policy, base, input.now);
}

function reviewWork(
  policy: WorkPolicy,
  base: { id: string; title: string; context: string },
  now: Date,
): MyWorkItem | null {
  if (!policy.approvedAt) return null;
  const due = reviewDueAt(policy.approvedAt);
  const days = (due.getTime() - now.getTime()) / DAY_MS;
  if (days > REVIEW_WINDOW_DAYS) return null;
  return { ...base, kind: 'review', dueOn: iso(due), overdue: days < 0 };
}

/** An item that names someone is theirs alone; one that names nobody is for whoever holds the DPO job, and for admins. */
function isMine(assigneeId: string | null, input: MyWorkInput): boolean {
  if (assigneeId) return assigneeId === input.personId;
  return input.isAdmin || input.roles.has('DPO');
}

/** An open breach is dated by the Board deadline until the Board is told. */
function breachWork(input: MyWorkInput): MyWorkItem[] {
  return input.breaches
    .filter((breach) => isMine(breach.assigneeId, input))
    .map((breach) => ({
      kind: 'breach' as const,
      id: breach.id,
      title: breach.title,
      context: breach.currentStep,
      dueOn: isBoardPending(breach.currentStep) ? iso(breach.reportDueAt) : null,
      overdue: breach.overdue,
    }));
}

/** An open request is dated by its due date. */
function requestWork(input: MyWorkInput): MyWorkItem[] {
  return input.requests
    .filter((request) => isMine(request.assigneeId, input))
    .map((request) => ({
      kind: 'request' as const,
      id: request.id,
      title: request.personName,
      context: request.type,
      dueOn: iso(request.dueAt),
      overdue: request.overdue,
    }));
}

/** A vendor's review, when its date is close or has passed. Nothing for a date that is not set or is still far off. */
function vendorWork(input: MyWorkInput): MyWorkItem[] {
  return input.vendors
    .filter((vendor) => isMine(vendor.ownerId, input))
    .flatMap((vendor) => {
      if (!vendor.reviewDueOn) return [];
      const days = (vendor.reviewDueOn.getTime() - input.now.getTime()) / DAY_MS;
      if (days > VENDOR_WINDOW_DAYS) return [];
      return [
        {
          kind: 'vendor' as const,
          id: vendor.id,
          title: vendor.name,
          context: 'review',
          dueOn: iso(vendor.reviewDueOn),
          overdue: days < 0,
        },
      ];
    });
}

/** A training to take, or to take again. It is late once its day has passed. */
function trainingWork(input: MyWorkInput): MyWorkItem[] {
  return input.training
    .filter((training) => training.personId === input.personId)
    .map((training) => ({
      kind: 'training' as const,
      id: training.id,
      title: training.name,
      context: 'training',
      dueOn: iso(training.dueOn),
      overdue: training.dueOn < input.now,
    }));
}

/** Everything assigned to one person, most urgent first. */
export function myWorkItems(input: MyWorkInput): MyWorkItem[] {
  const policies = input.policies.flatMap((policy) => policyWork(policy, input) ?? []);
  return [
    ...breachWork(input),
    ...requestWork(input),
    ...proofWork(input),
    ...vendorWork(input),
    ...trainingWork(input),
    ...policies,
  ].sort(byUrgency);
}

/** The counts for one person's items. */
export function workloadOf(personId: string, items: MyWorkItem[]): MyWorkload {
  return { personId, open: items.length, overdue: items.filter((i) => i.overdue).length };
}
