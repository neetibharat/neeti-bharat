import type { PolicyResponse } from '@dpdp-kit/shared';

export type AttentionReason = 'review_overdue' | 'awaiting_approval' | 'review_soon';

export interface AttentionItem {
  policy: PolicyResponse;
  reason: AttentionReason;
  /** Days past the review date, or days until it. Zero for a policy waiting for approval. */
  days: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** A review this close counts as coming up. */
export const REVIEW_SOON_DAYS = 30;

const PRIORITY: Record<AttentionReason, number> = {
  review_overdue: 0,
  awaiting_approval: 1,
  review_soon: 2,
};

function itemFor(policy: PolicyResponse, now: Date): AttentionItem | null {
  if (policy.status === 'in_review') return { policy, reason: 'awaiting_approval', days: 0 };
  if (policy.status !== 'approved' || !policy.reviewDueAt) return null;
  const days = Math.ceil((new Date(policy.reviewDueAt).getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return { policy, reason: 'review_overdue', days: -days };
  return days <= REVIEW_SOON_DAYS ? { policy, reason: 'review_soon', days } : null;
}

/** What someone should act on: reviews that are overdue, policies waiting for approval, then reviews coming up. */
export function attentionItems(
  policies: PolicyResponse[],
  now: Date = new Date(),
): AttentionItem[] {
  return policies
    .flatMap((policy) => itemFor(policy, now) ?? [])
    .sort((a, b) => PRIORITY[a.reason] - PRIORITY[b.reason] || b.days - a.days);
}

/** The first policies still in draft, in list order, to suggest as the next ones to work on. */
export function nextDrafts(policies: PolicyResponse[], count: number): PolicyResponse[] {
  return policies.filter((policy) => policy.status === 'draft').slice(0, count);
}
