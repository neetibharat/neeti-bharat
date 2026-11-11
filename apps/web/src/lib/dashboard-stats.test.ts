import type { PolicyResponse, ProofItemResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { dashboardAttention, overall } from './dashboard-stats';

const NOW = new Date('2026-11-10T12:00:00Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

const proof = (id: string, over: Partial<ProofItemResponse> = {}) =>
  ({ id, title: id, status: 'missing', overdue: false, dueOn: null, ...over }) as ProofItemResponse;

const policy = (id: string, over: Partial<PolicyResponse> = {}) =>
  ({
    id,
    title: id,
    status: 'draft',
    reviewDueAt: null,
    approver: 'DPO',
    approverPerson: null,
    ...over,
  }) as PolicyResponse;

describe('overall', () => {
  it('adds up controls across frameworks', () => {
    const result = overall([
      { controlsDone: 5, controlsTotal: 10 },
      { controlsDone: 1, controlsTotal: 10 },
    ] as never);
    expect(result).toEqual({ done: 6, total: 20, percent: 30 });
  });

  it('is zero with no controls', () => {
    expect(overall([]).percent).toBe(0);
  });
});

describe('dashboardAttention', () => {
  it('puts late proof and reviews first, then approvals, then reviews coming up', () => {
    const items = dashboardAttention(
      [
        policy('P1', { status: 'in_review' }),
        policy('P2', { status: 'approved', reviewDueAt: day(10) }),
        policy('P3', { status: 'approved', reviewDueAt: day(-4) }),
      ],
      [proof('x', { overdue: true, dueOn: day(-2) }), proof('y')],
      NOW,
    );
    expect(items.map((i) => [i.reason, i.key])).toEqual([
      ['review_overdue', 'policy:P3'],
      ['proof_overdue', 'proof:x'],
      ['awaiting_approval', 'policy:P1'],
      ['review_soon', 'policy:P2'],
    ]);
  });
});
