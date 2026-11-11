import type { FrameworkSummaryResponse, PolicyResponse, ProofItemResponse } from '@dpdp-kit/shared';
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

export type DashboardReason = AttentionReason | 'proof_overdue';

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
  proof_overdue: 0,
  review_overdue: 0,
  awaiting_approval: 1,
  review_soon: 2,
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

/** What the company should look at first: late proof and reviews, then approvals, then reviews coming up. */
export function dashboardAttention(
  policies: PolicyResponse[],
  proof: ProofItemResponse[],
  now: Date = new Date(),
): DashboardAttention[] {
  const fromPolicies = attentionItems(policies, now).map((item) => ({
    key: `policy:${item.policy.id}`,
    reason: item.reason,
    href: `/policies/${item.policy.id}`,
    title: `${item.policy.id} · ${item.policy.title}`,
    days: item.days,
    approver: approverOf(item.policy),
  }));
  return [...overdueProof(proof, now), ...fromPolicies].sort(
    (a, b) => RANK[a.reason] - RANK[b.reason] || b.days - a.days,
  );
}
