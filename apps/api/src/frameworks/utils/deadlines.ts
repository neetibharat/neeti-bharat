import {
  DEADLINE_WEEK_DAYS,
  isBoardPending,
  proofDue,
  proofStatus,
  reviewDueAt,
  type DeadlineCounts,
  type DeadlineItem,
  type DeadlineTab,
} from '@dpdp-kit/shared';
import { type ControlRow } from './checklist-view';
import { lastProvided } from './dates';
import type { WorkBreach, WorkPolicy, WorkRequest, WorkTraining, WorkVendor } from './my-work';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A policy or vendor review shows up this long before it falls due. */
const REVIEW_WINDOW_DAYS = 30;

export interface DeadlineInput {
  controls: ControlRow[];
  policies: WorkPolicy[];
  breaches: WorkBreach[];
  requests: WorkRequest[];
  vendors: WorkVendor[];
  training: WorkTraining[];
  /** Names by person id, for the people who have not left. */
  names: ReadonlyMap<string, string>;
  now: Date;
}

type Dated = Omit<DeadlineItem, 'assigneeName'> & { assigneeId: string | null };

function proofDeadlines(input: DeadlineInput): Dated[] {
  return input.controls.flatMap((control) =>
    control.proofRequirements.flatMap((requirement) => {
      const last = lastProvided(requirement.evidence);
      if (proofStatus(last, requirement.frequency, input.now) === 'provided') return [];
      const due = proofDue(last, requirement.frequency, requirement.dueDate, input.now);
      if (!due.dueOn) return [];
      return [
        {
          kind: 'proof' as const,
          id: requirement.id,
          title: requirement.title,
          context: control.title,
          dueOn: due.dueOn.toISOString(),
          overdue: due.overdue,
          assigneeId: (requirement.assignee ?? control.assignee)?.id ?? null,
        },
      ];
    }),
  );
}

/** An open breach is dated by the Board deadline until the Board is told. */
const breachDeadlines = (input: DeadlineInput): Dated[] =>
  input.breaches
    .filter((breach) => isBoardPending(breach.currentStep))
    .map((breach) => ({
      kind: 'breach' as const,
      id: breach.id,
      title: breach.title,
      context: breach.currentStep,
      dueOn: breach.reportDueAt.toISOString(),
      overdue: breach.overdue,
      assigneeId: breach.assigneeId,
    }));

const requestDeadlines = (input: DeadlineInput): Dated[] =>
  input.requests.map((request) => ({
    kind: 'request' as const,
    id: request.id,
    title: request.personName,
    context: request.type,
    dueOn: request.dueAt.toISOString(),
    overdue: request.overdue,
    assigneeId: request.assigneeId,
  }));

const withinWindow = (due: Date, now: Date): boolean =>
  (due.getTime() - now.getTime()) / DAY_MS <= REVIEW_WINDOW_DAYS;

function vendorDeadlines(input: DeadlineInput): Dated[] {
  return input.vendors.flatMap((vendor) =>
    vendor.reviewDueOn && withinWindow(vendor.reviewDueOn, input.now)
      ? [
          {
            kind: 'vendor' as const,
            id: vendor.id,
            title: vendor.name,
            context: 'review',
            dueOn: vendor.reviewDueOn.toISOString(),
            overdue: vendor.reviewDueOn < input.now,
            assigneeId: vendor.ownerId,
          },
        ]
      : [],
  );
}

const trainingDeadlines = (input: DeadlineInput): Dated[] =>
  input.training.map((training) => ({
    kind: 'training' as const,
    id: training.id,
    title: training.name,
    context: 'training',
    dueOn: training.dueOn.toISOString(),
    overdue: training.dueOn < input.now,
    assigneeId: training.personId,
  }));

function reviewDeadlines(input: DeadlineInput): Dated[] {
  return input.policies.flatMap((policy) => {
    if (policy.status !== 'approved' || !policy.approvedAt) return [];
    const due = reviewDueAt(policy.approvedAt);
    if (!withinWindow(due, input.now)) return [];
    return [
      {
        kind: 'review' as const,
        id: policy.id,
        title: policy.title,
        context: policy.id,
        dueOn: due.toISOString(),
        overdue: due < input.now,
        assigneeId: null,
      },
    ];
  });
}

/** Every dated job in the company, whoever it belongs to, earliest first. */
export function deadlineItems(input: DeadlineInput): DeadlineItem[] {
  return [
    ...breachDeadlines(input),
    ...requestDeadlines(input),
    ...proofDeadlines(input),
    ...vendorDeadlines(input),
    ...trainingDeadlines(input),
    ...reviewDeadlines(input),
  ]
    .map(({ assigneeId, ...item }) => ({
      ...item,
      assigneeName: assigneeId ? (input.names.get(assigneeId) ?? null) : null,
    }))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

/** Which tab a deadline is on. */
export function tabOf(item: DeadlineItem, now: Date): DeadlineTab {
  if (item.overdue || new Date(item.dueOn) < now) return 'overdue';
  const days = (new Date(item.dueOn).getTime() - now.getTime()) / DAY_MS;
  return days <= DEADLINE_WEEK_DAYS ? 'week' : 'later';
}

export function countTabs(items: DeadlineItem[], now: Date): DeadlineCounts {
  const counts: DeadlineCounts = { overdue: 0, week: 0, later: 0 };
  for (const item of items) counts[tabOf(item, now)] += 1;
  return counts;
}
