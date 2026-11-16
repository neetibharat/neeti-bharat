import {
  policyLabel,
  type BreachListItem,
  FrameworkSummaryResponse,
  PolicyResponse,
  ProofItemResponse,
  RequestListItem,
} from '@dpdp-kit/shared';
import { percentOf } from './percent';
import { approverOf } from './policy-filter';
import { attentionItems, type AttentionReason } from './policy-attention';

export interface Overall {
  done: number;
  total: number;
  percent: number;
}

/** Controls done across every framework, counted once each. */
export function overall(frameworks: FrameworkSummaryResponse[]): Overall {
  const done = frameworks.reduce((sum, f) => sum + f.controlsDone, 0);
  const total = frameworks.reduce((sum, f) => sum + f.controlsTotal, 0);
  return { done, total, percent: percentOf(done, total) };
}

export interface ProofFigures {
  total: number;
  provided: number;
  overdue: number;
}

export type DashboardReason =
  | AttentionReason
  | 'proof_overdue'
  | 'breach_overdue'
  | 'breach_open'
  | 'request_overdue'
  | 'request_due_soon';

export interface DashboardAttention {
  key: string;
  reason: DashboardReason;
  href: string;
  title: string;
  /** Days late or until due; zero for something waiting on a decision. */
  days: number;
  /** Who it waits on, for approvals. */
  approver: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RANK: Record<DashboardReason, number> = {
  breach_overdue: -2,
  breach_open: -1,
  proof_overdue: 0,
  review_overdue: 0,
  request_overdue: 0,
  awaiting_approval: 1,
  request_due_soon: 2,
  review_soon: 3,
};

function overdueProof(items: ProofItemResponse[], now: Date): DashboardAttention[] {
  return items.flatMap((item) =>
    item.overdue && item.dueOn
      ? [
          {
            key: `proof:${item.id}`,
            reason: 'proof_overdue' as const,
            href: `/proof/${item.id}`,
            title: item.title,
            days: Math.max(0, Math.ceil((now.getTime() - new Date(item.dueOn).getTime()) / DAY_MS)),
            approver: '',
          },
        ]
      : [],
  );
}

function openBreaches(breaches: BreachListItem[]): DashboardAttention[] {
  return breaches.map((breach) => ({
    key: `breach:${breach.id}`,
    reason: breach.overdue ? 'breach_overdue' : 'breach_open',
    href: `/breaches/${breach.id}`,
    title: breach.title,
    days: 0,
    approver: '',
  }));
}

/** Open requests that are late, or due within the week the API already limited them to. */
function openRequests(requests: RequestListItem[], now: Date): DashboardAttention[] {
  return requests.map((request) => {
    const days = (new Date(request.dueAt).getTime() - now.getTime()) / DAY_MS;
    const late = days < 0;
    return {
      key: `request:${request.id}`,
      reason: late ? 'request_overdue' : 'request_due_soon',
      href: `/requests/${request.id}`,
      title: request.personName,
      days: late ? Math.ceil(-days) : Math.floor(days),
      approver: '',
    };
  });
}

/** Late items count down the other way: the one most overdue leads, but of those coming up the nearest does. */
const byDays = (a: DashboardAttention, b: DashboardAttention): number =>
  a.reason === 'request_due_soon' ? a.days - b.days : b.days - a.days;

/** What the company should look at first: open breaches, then late proof, reviews and requests, approvals, and what is coming up. */
export function dashboardAttention(
  policies: PolicyResponse[],
  proof: ProofItemResponse[],
  now: Date = new Date(),
  breaches: BreachListItem[] = [],
  requests: RequestListItem[] = [],
): DashboardAttention[] {
  const fromPolicies = attentionItems(policies, now).map((item) => ({
    key: `policy:${item.policy.id}`,
    reason: item.reason,
    href: `/policies/${item.policy.id}`,
    title: policyLabel(item.policy),
    days: item.days,
    approver: approverOf(item.policy),
  }));
  return [
    ...openBreaches(breaches),
    ...overdueProof(proof, now),
    ...openRequests(requests, now),
    ...fromPolicies,
  ].sort((a, b) => RANK[a.reason] - RANK[b.reason] || byDays(a, b));
}
