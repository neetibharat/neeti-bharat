import type {
  BreachListItem,
  PolicyResponse,
  ProofItemResponse,
  RequestListItem,
} from '@dpdp-kit/shared';
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

  it('puts open breaches before everything else, the late ones first', () => {
    const breach = (id: string, overdue: boolean) => ({ id, title: id, overdue }) as BreachListItem;
    const items = dashboardAttention(
      [policy('P3', { status: 'approved', reviewDueAt: day(-4) })],
      [proof('x', { overdue: true, dueOn: day(-2) })],
      NOW,
      [breach('b1', false), breach('b2', true)],
    );
    expect(items.map((i) => [i.reason, i.href])).toEqual([
      ['breach_overdue', '/breaches/b2'],
      ['breach_open', '/breaches/b1'],
      ['review_overdue', '/policies/P3'],
      ['proof_overdue', '/proof/x'],
    ]);
  });

  describe('open requests', () => {
    const request = (id: string, dueInDays: number) =>
      ({ id, personName: id, dueAt: day(dueInDays) }) as RequestListItem;

    it('lists late requests with proof that is late, most overdue first, and coming ones after approvals', () => {
      const items = dashboardAttention(
        [
          policy('P1', { status: 'in_review' }),
          policy('P2', { status: 'approved', reviewDueAt: day(10) }),
        ],
        [proof('x', { overdue: true, dueOn: day(-2) })],
        NOW,
        [],
        [request('r-soon-far', 6), request('r-late', -5), request('r-soon-near', 2)],
      );
      expect(items.map((i) => [i.reason, i.key])).toEqual([
        ['request_overdue', 'request:r-late'],
        ['proof_overdue', 'proof:x'],
        ['awaiting_approval', 'policy:P1'],
        ['request_due_soon', 'request:r-soon-near'],
        ['request_due_soon', 'request:r-soon-far'],
        ['review_soon', 'policy:P2'],
      ]);
    });

    it('links to the request and says how many days', () => {
      const [late, soon] = dashboardAttention([], [], NOW, [], [request('a', -3), request('b', 4)]);
      expect(late).toMatchObject({ href: '/requests/a', title: 'a', days: 3 });
      expect(soon).toMatchObject({ href: '/requests/b', days: 4 });
    });

    it('puts breaches before requests', () => {
      const breach = { id: 'b1', title: 'b1', overdue: false } as BreachListItem;
      const items = dashboardAttention([], [], NOW, [breach], [request('r', -1)]);
      expect(items.map((i) => i.reason)).toEqual(['breach_open', 'request_overdue']);
    });
  });
});
